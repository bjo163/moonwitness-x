from services.erp.core.registry import AddonManifest

manifest = AddonManifest(
    name="accounting",
    version="1.0.0",
    depends=["base", "sales", "subscription"],
    description="Invoicing & Billing: account.move, account.move.line, dunning"
)
