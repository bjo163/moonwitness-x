from services.erp.core.registry import AddonManifest

manifest = AddonManifest(
    name="isp",
    version="1.0.0",
    depends=["base", "subscription"],
    description="ISP & ToughRADIUS Bridge: Extends res.partner and provides isp.nas.binding"
)
