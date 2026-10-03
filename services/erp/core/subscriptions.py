"""Subscription lifecycle transition contract."""

from typing import Any


ALLOWED_SUBSCRIPTION_TRANSITIONS = {
    "draft": {"pending_activation", "cancelled"},
    "pending_activation": {"active", "suspended", "cancelled"},
    "active": {"past_due", "suspended", "isolated", "paused", "cancelled"},
    "past_due": {"active", "suspended", "isolated", "cancelled"},
    "suspended": {"pending_activation", "cancelled"},
    "isolated": {"active", "suspended", "cancelled"},
    "paused": {"active", "cancelled"},
    "cancelled": set(),
}


class InvalidSubscriptionTransition(ValueError):
    """Raised when a command requests an illegal subscription state change."""


def transition_subscription(subscription: Any, new_state: str) -> str:
    """Validate and apply one explicit lifecycle transition; return old state."""
    old_state = subscription.state
    if new_state not in ALLOWED_SUBSCRIPTION_TRANSITIONS.get(old_state, set()):
        raise InvalidSubscriptionTransition(
            f"Subscription cannot transition from {old_state!r} to {new_state!r}"
        )
    subscription.state = new_state
    return old_state
