from services.erp.core.registry import AddonManifest

manifest = AddonManifest(
    name="subscription",
    version="1.0.0",
    depends=["base", "sales"],
    description="Recurring Contracts & Subscriptions: sale.subscription, subscription.line, subscription.event"
)
