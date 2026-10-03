"""
Moonwitness ERP — CRM Models (crm.stage, crm.lead)
"""
from services.erp.core.registry import Model
from services.erp.core.fields import (
    CharField, TextField, IntegerField, MoneyField, Many2One, Selection, BooleanField
)


class CrmStage(Model):
    _name = "crm.stage"
    _company_scoped = False
    _description = "CRM Pipeline Stage"

    name = CharField(max_length=64, required=True, string="Stage Name")
    sequence = IntegerField(default=10, string="Sort Sequence")
    is_won = BooleanField(default=False, string="Is Won Stage")
    is_lost = BooleanField(default=False, string="Is Lost Stage")


class CrmLead(Model):
    _name = "crm.lead"
    _description = "CRM Lead / Opportunity"

    name = CharField(max_length=255, required=True, index=True, string="Opportunity Title")
    partner_id = Many2One("res.partner", string="Customer")
    contact_name = CharField(max_length=128, string="Contact Person")
    email = CharField(max_length=128, string="Email Address")
    phone = CharField(max_length=64, string="Phone / WhatsApp")
    
    expected_revenue = MoneyField(string="Expected Revenue")
    probability = IntegerField(required=True, default=20, minimum=0, maximum=100, string="Success Probability (%)")
    
    stage = Selection([
        ("new", "New"),
        ("qualified", "Qualified"),
        ("proposition", "Proposition"),
        ("won", "Won"),
        ("lost", "Lost")
    ], default="new", index=True, string="Pipeline Stage")

    description = TextField(string="Notes & Requirements")
