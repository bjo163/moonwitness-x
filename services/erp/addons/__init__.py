"""
Moonwitness ERP — Addons Loader
Registers all built-in core addons into the ERP Registry.
"""
from services.erp.core.registry import registry
from services.erp.addons.base.manifest import manifest as base_manifest
from services.erp.addons.base.models import ResCompany, ResPartner, IrSequence

from services.erp.addons.crm.manifest import manifest as crm_manifest
from services.erp.addons.crm.models import CrmStage, CrmLead

from services.erp.addons.sales.manifest import manifest as sales_manifest
from services.erp.addons.sales.models import ProductTemplate, SaleOrder, SaleOrderLine

from services.erp.addons.subscription.manifest import manifest as sub_manifest
from services.erp.addons.subscription.models import SaleSubscription, SubscriptionLine, SubscriptionEvent

from services.erp.addons.isp.manifest import manifest as isp_manifest
from services.erp.addons.isp.models import PartnerIspExtension, IspNasBinding

from services.erp.addons.project.manifest import manifest as project_manifest
from services.erp.addons.project.models import ProjectProject

from services.erp.addons.accounting.manifest import manifest as acct_manifest
from services.erp.addons.accounting.models import AccountMove, AccountMoveLine
from services.erp.addons.custom_fields import schema as _custom_field_schema  # noqa: F401 - register tenant custom-field tables in Alembic metadata
from services.erp.addons.custom_fields.manifest import manifest as custom_fields_manifest


def load_all_addons():
    """Register all available addons into the central immutable registry"""
    registry.register_addon(base_manifest, [ResCompany, ResPartner, IrSequence])
    registry.register_addon(crm_manifest, [CrmStage, CrmLead])
    registry.register_addon(sales_manifest, [ProductTemplate, SaleOrder, SaleOrderLine])
    registry.register_addon(sub_manifest, [SaleSubscription, SubscriptionLine, SubscriptionEvent])
    registry.register_addon(isp_manifest, [PartnerIspExtension, IspNasBinding])
    registry.register_addon(project_manifest, [ProjectProject])
    registry.register_addon(acct_manifest, [AccountMove, AccountMoveLine])
    registry.register_addon(custom_fields_manifest, [])
    
    # Compile all models & _inherit extensions into final SQLAlchemy classes
    registry.compile()
