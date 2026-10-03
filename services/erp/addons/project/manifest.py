from services.erp.core.registry import AddonManifest

manifest = AddonManifest(
    name="project",
    version="1.0.0",
    depends=["base", "subscription"],
    description="Cloud Project & Runner Bridge: project.project linked to Universe Runner containers"
)
