"""
Moonwitness ERP — ISP Models
Extends res.partner with RADIUS subscriber fields and provides isp.nas.binding table.
"""
from services.erp.core.registry import Model
from services.erp.core.fields import (
    CharField, IntegerField, Many2One, Selection
)


class PartnerIspExtension(Model):
    """
    In-place model extension of `res.partner`.
    Adds ToughRADIUS Broadband provisioning attributes without creating a separate table!
    """
    _inherit = "res.partner"

    radius_username = CharField(max_length=64, index=True, string="RADIUS / PPPoE Username")
    radius_profile = CharField(max_length=64, default="10M_BROADBAND", string="Assigned Rate Profile")
    radius_framed_ip = CharField(max_length=45, string="Assigned Static IP")
    radius_credential_ciphertext = CharField(
        max_length=512,
        sensitive=True,
        string="Encrypted RADIUS credential",
    )
    
    radius_status = Selection([
        ("active", "Active PPPoE"),
        ("isolated", "Isolated / Suspended"),
        ("disabled", "Disabled")
    ], default="active", string="Broadband Status")


class IspNasBinding(Model):
    """
    Addon-owned extension table mapping customers to specific NAS Routers / VLANs.
    """
    _name = "isp.nas.binding"
    _description = "ISP NAS Router & VLAN Binding"

    partner_id = Many2One("res.partner", required=True, ondelete="CASCADE", string="Customer")
    nas_ip = CharField(max_length=45, required=True, string="Router / NAS IP")
    vlan_id = IntegerField(default=100, string="VLAN ID")
    circuit_id = CharField(max_length=64, string="Fiber Circuit / OLT Port")
