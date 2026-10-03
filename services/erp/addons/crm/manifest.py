from services.erp.core.registry import AddonManifest

manifest = AddonManifest(
    name="crm",
    version="1.0.0",
    depends=["base"],
    description="CRM & Opportunity Pipeline: crm.lead, crm.stage"
)
