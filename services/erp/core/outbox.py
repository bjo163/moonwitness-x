"""
Moonwitness ERP — Transactional Outbox Pattern & Background Dispatcher
Ensures zero distributed transaction failures between ERP state changes and Go services (:5170 RADIUS, :5160 Runner).
"""
import asyncio
import logging
import datetime
import uuid
import random
from types import SimpleNamespace
from typing import Optional, Dict, Any
from sqlalchemy import (
    Column, String, Text, Integer, DateTime, JSON, ForeignKey, select, update, and_, or_
)
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from services.erp.core.db import Base, AsyncSessionLocal
from services.erp.core.config import settings
from services.erp.core.security import CredentialEncryptionUnavailable, decrypt_secret
from services.erp.core.registry import registry
from services.erp.core.clock import utc_now
from services.erp.core.subscriptions import transition_subscription

logger = logging.getLogger("erp.outbox")


class OutboxEvent(Base):
    """
    Transactional Outbox Table.
    Recorded in the exact same database transaction as the business entity changes.
    """
    __tablename__ = "erp_outbox_event"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("res_company.id", ondelete="RESTRICT"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    
    # Event metadata
    event_type = Column(String(64), nullable=False, index=True) # e.g. 'subscription.activated', 'subscription.isolated'
    target_service = Column(String(32), nullable=False, index=True) # e.g. 'radius', 'runner'
    idempotency_key = Column(String(128), unique=True, nullable=False, index=True)
    payload = Column(JSON, nullable=False)
    
    # Delivery tracking state machine
    status = Column(String(16), default="PENDING", index=True) # PENDING, PROCESSING, COMPLETED, FAILED, DEAD_LETTER
    attempts = Column(Integer, default=0)
    max_attempts = Column(Integer, default=5)
    last_error = Column(Text, nullable=True)
    next_retry_at = Column(DateTime(timezone=True), default=utc_now)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    lease_token = Column(String(36), nullable=True, index=True)
    lease_expires_at = Column(DateTime(timezone=True), nullable=True, index=True)


async def emit_outbox_event(
    session: AsyncSession,
    event_type: str,
    target_service: str,
    idempotency_key: str,
    payload: Dict[str, Any]
) -> OutboxEvent:
    """Record a domain event within the current open transaction"""
    event = OutboxEvent(
        event_type=event_type,
        target_service=target_service,
        idempotency_key=idempotency_key,
        payload=payload,
        status="PENDING",
        attempts=0,
        next_retry_at=utc_now()
    )
    session.add(event)
    return event


class OutboxDispatcher:
    """
    Resilient background worker that polls PENDING outbox events,
    dispatches HTTP commands to Go microservices, and updates execution state.
    """
    def __init__(self):
        self._is_running = False
        self._task: Optional[asyncio.Task] = None
        self._http_client: Optional[httpx.AsyncClient] = None

    async def start(self):
        if self._is_running:
            return
        self._is_running = True
        self._http_client = httpx.AsyncClient(timeout=10.0)
        self._task = asyncio.create_task(self._worker_loop())
        logger.info("📡 Outbox Dispatcher Worker started (polling every %.1fs)", settings.outbox_poll_interval_seconds)

    async def stop(self):
        self._is_running = False
        if self._task:
            # Let the current claim/delivery transaction finish cleanly before
            # closing the PostgreSQL pool.
            await self._task
            self._task = None
        if self._http_client:
            await self._http_client.aclose()
        logger.info("🛑 Outbox Dispatcher Worker stopped")

    async def _worker_loop(self):
        while self._is_running:
            try:
                await self._process_batch()
            except Exception as e:
                logger.error("Error in outbox worker loop: %s", e)
            await asyncio.sleep(settings.outbox_poll_interval_seconds)

    async def _process_batch(self):
        now = utc_now()
        claimed: list[tuple[str, str]] = []
        async with AsyncSessionLocal() as session:
            await session.execute(
                update(OutboxEvent)
                .where(
                    OutboxEvent.status == "PROCESSING",
                    OutboxEvent.lease_expires_at <= now,
                    OutboxEvent.attempts >= OutboxEvent.max_attempts,
                )
                .values(status="DEAD_LETTER", lease_token=None, lease_expires_at=None,
                        last_error="Worker lease expired after maximum attempts")
            )
            await session.commit()

            eligible = or_(
                and_(
                    OutboxEvent.status.in_(["PENDING", "FAILED"]),
                    OutboxEvent.next_retry_at <= now,
                ),
                and_(
                    OutboxEvent.status == "PROCESSING",
                    OutboxEvent.lease_expires_at <= now,
                ),
            )
            ids = (await session.execute(
                select(OutboxEvent.id)
                .where(eligible, OutboxEvent.attempts < OutboxEvent.max_attempts)
                .order_by(OutboxEvent.created_at.asc())
                .limit(10)
            )).scalars().all()

            for event_id in ids:
                token = str(uuid.uuid4())
                claim = await session.execute(
                    update(OutboxEvent)
                    .where(
                        OutboxEvent.id == event_id,
                        OutboxEvent.attempts < OutboxEvent.max_attempts,
                        eligible,
                    )
                    .values(
                        status="PROCESSING",
                        attempts=OutboxEvent.attempts + 1,
                        lease_token=token,
                        lease_expires_at=now + datetime.timedelta(seconds=settings.outbox_lease_seconds),
                    )
                    .execution_options(synchronize_session=False)
                )
                await session.commit()
                if claim.rowcount == 1:
                    claimed.append((event_id, token))

        for event_id, token in claimed:
            await self._dispatch_event(event_id, token)

    async def _dispatch_event(self, event_id: str, lease_token: str):
        async with AsyncSessionLocal() as session:
            event = (await session.execute(
                select(OutboxEvent).where(
                    OutboxEvent.id == event_id,
                    OutboxEvent.lease_token == lease_token,
                    OutboxEvent.status == "PROCESSING",
                )
            )).scalar_one_or_none()
            if event is None:
                return
            command = SimpleNamespace(
                id=event.id,
                event_type=event.event_type,
                target_service=event.target_service,
                idempotency_key=event.idempotency_key,
                payload=event.payload,
                attempts=event.attempts,
                max_attempts=event.max_attempts,
            )

        success = False
        error_msg = None

        try:
            if command.target_service == "radius":
                success, error_msg = await self._send_to_radius(command)
            elif command.target_service == "runner":
                success, error_msg = await self._send_to_runner(command)
            else:
                success = False
                error_msg = f"Unknown target service: {command.target_service}"
        except Exception as e:
            success = False
            error_msg = str(e)

        async with AsyncSessionLocal() as session:
            values = {"lease_token": None, "lease_expires_at": None}
            if success:
                values.update(
                    status="COMPLETED",
                    completed_at=utc_now(),
                    last_error=None,
                )
                logger.info("Outbox event %s (%s) delivered to %s", command.id, command.event_type, command.target_service)
            else:
                values["last_error"] = (error_msg or "Unknown delivery error")[:2000]
                if command.attempts >= command.max_attempts:
                    values["status"] = "DEAD_LETTER"
                    logger.error("Outbox event %s dead-lettered after %d attempts", command.id, command.attempts)
                else:
                    values["status"] = "FAILED"
                    backoff = min(3600, 2 ** min(command.attempts, 10))
                    delay = random.uniform(backoff * 0.8, backoff * 1.2)
                    values["next_retry_at"] = utc_now() + datetime.timedelta(seconds=delay)
                    logger.warning("Outbox event %s failed (%d/%d); retry scheduled in %.1fs: %s", command.id, command.attempts, command.max_attempts, delay, error_msg)

            result = await session.execute(
                update(OutboxEvent)
                .where(
                    OutboxEvent.id == event_id,
                    OutboxEvent.lease_token == lease_token,
                    OutboxEvent.status == "PROCESSING",
                )
                .values(**values)
            )
            await session.commit()
            if result.rowcount == 0:
                logger.warning("Outbox event %s lease expired before result persistence", event_id)
            elif success and command.event_type in {
                "subscription.activated", "subscription.resumed"
            } and command.payload.get("subscription_id"):
                Subscription = registry.get_model("sale.subscription")
                Partner = registry.get_model("res.partner")
                SubscriptionEvent = registry.get_model("subscription.event")
                sub = (await session.execute(
                    select(Subscription).where(
                        Subscription.id == command.payload["subscription_id"]
                    )
                )).scalar_one_or_none()
                if sub and sub.state == "pending_activation":
                    previous_state = transition_subscription(sub, "active")
                    partner = (await session.execute(
                        select(Partner).where(Partner.id == sub.partner_id)
                    )).scalar_one_or_none()
                    if partner and sub.technical_service == "isp_radius":
                        partner.radius_status = "active"
                    session.add(SubscriptionEvent(
                        subscription_id=sub.id,
                        event_type="PROVISIONED",
                        previous_state=previous_state,
                        new_state="active",
                        actor=f"service:{command.target_service}",
                        reason="Provisioning service acknowledged the desired state",
                        note=f"Provisioning command {command.idempotency_key} acknowledged by {command.target_service}",
                    ))
                await session.commit()

    async def _send_to_radius(self, event: OutboxEvent) -> tuple[bool, Optional[str]]:
        """Dispatch subscriber provisioning or CoA disconnect to ToughRADIUS (:5170)"""
        url = f"{settings.radius_service_url}/api/v1/radius/subscribers"
        payload = event.payload
        
        # Action routing
        action = payload.get("action", "upsert")
        if action == "upsert":
            encrypted_password = payload.get("password_encrypted")
            if not encrypted_password:
                return False, "Encrypted RADIUS credential is required for subscriber provisioning"
            try:
                password = decrypt_secret(encrypted_password)
            except CredentialEncryptionUnavailable as exc:
                return False, str(exc)
            # Post subscriber to RADIUS
            resp = await self._http_client.post(url, json={
                "username": payload.get("username"),
                "password": password,
                "profileId": payload.get("rate_profile", "10M_BROADBAND"),
                "status": payload.get("status", "active")
            }, headers={
                "Idempotency-Key": event.idempotency_key,
            })
            if resp.status_code in (200, 201):
                return True, None
            return False, f"RADIUS API error: HTTP {resp.status_code} - {resp.text}"

        elif action == "disconnect":
            # 1. Find the active session for this username
            username = payload.get("username")
            sessions_url = f"{settings.radius_service_url}/api/v1/radius/sessions"
            try:
                sessions_resp = await self._http_client.get(sessions_url)
                sessions_data = sessions_resp.json()
                # Handle both {"sessions": [...]} and [...] shapes
                sessions_list = sessions_data if isinstance(sessions_data, list) else sessions_data.get("sessions", [])
                session = next((s for s in sessions_list if s.get("username") == username), None)
            except Exception as e:
                return False, f"RADIUS sessions lookup error: {e}"

            if not session:
                # No active session to disconnect — gracefully succeed (subscriber offline)
                logger.info("⚠️ No active RADIUS session for %s, skipping CoA disconnect", username)
                return True, None

            # 2. Send PoD with the resolved sessionId
            disc_url = f"{settings.radius_service_url}/api/v1/radius/sessions/disconnect"
            resp = await self._http_client.post(disc_url, json={
                "sessionId": session.get("id") or session.get("sessionId"),
            }, headers={
                "Idempotency-Key": event.idempotency_key,
            })
            if resp.status_code in (200, 201):
                return True, None
            return False, f"RADIUS CoA Disconnect error: HTTP {resp.status_code} - {resp.text}"

        return True, None

    async def _send_to_runner(self, event: OutboxEvent) -> tuple[bool, Optional[str]]:
        """Dispatch workload deployment or action to Universe Runner (:5160)"""
        payload = event.payload
        action = payload.get("action")
        if action == "deploy":
            url = f"{settings.runner_service_url}/api/v1/runner/workloads/deploy"
        elif action in {"start", "stop", "restart", "delete"}:
            url = f"{settings.runner_service_url}/api/v1/runner/workloads/action"
        else:
            return False, f"Unsupported Runner command action: {action!r}"

        body = {key: value for key, value in payload.items() if key != "subscription_id"}
        resp = await self._http_client.post(url, json=body, headers={
            "Idempotency-Key": event.idempotency_key,
        })
        if resp.status_code in (200, 201):
            return True, None
        return False, f"Runner API error: HTTP {resp.status_code} - {resp.text}"


# Global Singleton Dispatcher Instance
outbox_dispatcher = OutboxDispatcher()
