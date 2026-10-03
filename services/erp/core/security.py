"""Small envelope for credentials stored by ERP and delivered to adapters."""

import hmac
import json
import uuid

from cryptography.fernet import Fernet, InvalidToken

from services.erp.core.config import settings


class CredentialEncryptionUnavailable(RuntimeError):
    pass


def api_key_matches(presented: str | None, configured: str | None) -> bool:
    """Compare API bearer tokens without leaking a content-dependent timing signal."""
    if not presented or not configured:
        return False
    return hmac.compare_digest(presented.encode("utf-8"), configured.encode("utf-8"))


def configured_tenant_keys() -> dict[str, str]:
    """Read company-id -> bearer-token configuration without exposing it in logs."""
    configured = settings.tenant_api_keys
    if configured is None:
        return {}
    try:
        mapping = json.loads(configured.get_secret_value())
    except (TypeError, json.JSONDecodeError) as exc:
        raise RuntimeError("MW_ERP_TENANT_API_KEYS must be a JSON object") from exc
    if not isinstance(mapping, dict):
        raise RuntimeError("MW_ERP_TENANT_API_KEYS must be a JSON object")
    normalized: dict[str, str] = {}
    for company_id, token in mapping.items():
        try:
            normalized_id = str(uuid.UUID(company_id))
        except (ValueError, TypeError, AttributeError) as exc:
            raise RuntimeError("MW_ERP_TENANT_API_KEYS contains an invalid company UUID") from exc
        if not isinstance(token, str) or len(token) < 32:
            raise RuntimeError("Every tenant API key must contain at least 32 characters")
        normalized[normalized_id] = token
    return normalized


def company_for_tenant_key(presented: str | None) -> str | None:
    if not presented:
        return None
    matched_company = None
    for company_id, token in configured_tenant_keys().items():
        if hmac.compare_digest(presented.encode("utf-8"), token.encode("utf-8")):
            matched_company = company_id
    return matched_company


def _fernet() -> Fernet:
    key = settings.credential_encryption_key
    if not key:
        raise CredentialEncryptionUnavailable(
            "MW_ERP_CREDENTIAL_ENCRYPTION_KEY must be configured before storing or using service credentials"
        )
    try:
        return Fernet(key.encode("ascii"))
    except (ValueError, UnicodeEncodeError) as exc:
        raise CredentialEncryptionUnavailable(
            "MW_ERP_CREDENTIAL_ENCRYPTION_KEY must be a valid Fernet key"
        ) from exc


def encrypt_secret(secret: str) -> str:
    if not secret:
        raise ValueError("Credential cannot be empty")
    return _fernet().encrypt(secret.encode("utf-8")).decode("ascii")


def decrypt_secret(ciphertext: str) -> str:
    try:
        return _fernet().decrypt(ciphertext.encode("ascii")).decode("utf-8")
    except InvalidToken as exc:
        raise CredentialEncryptionUnavailable(
            "Stored service credential cannot be decrypted; check the configured key"
        ) from exc
