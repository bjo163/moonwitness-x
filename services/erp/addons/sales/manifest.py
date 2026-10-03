from services.erp.core.registry import AddonManifest

manifest = AddonManifest(
    name="sales",
    version="1.0.0",
    depends=["base"],
    description="Sales & Quotations: product.template, sale.order, sale.order.line"
)
