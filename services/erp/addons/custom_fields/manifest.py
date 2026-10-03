from services.erp.core.registry import AddonManifest

manifest = AddonManifest(
    name="custom_fields",
    version="1.0.0",
    depends=["base"],
    description="Company-scoped custom-field metadata and typed values",
    capabilities=["postgresql"],
)
