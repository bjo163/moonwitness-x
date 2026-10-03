"""
Moonwitness ERP — Base Models (res.company, res.partner, ir.sequence)
"""
from services.erp.core.registry import Model
from services.erp.core.fields import CharField, TextField, BooleanField, IntegerField


class ResCompany(Model):
    _name = "res.company"
    _description = "Legal Company & Multi-Tenant Organization"

    name = CharField(max_length=255, required=True, string="Company Name")
    code = CharField(max_length=32, required=True, unique=True, string="Short Code")
    currency_code = CharField(max_length=8, default="IDR", string="Base Currency")
    email = CharField(max_length=128, string="Email")
    phone = CharField(max_length=64, string="Phone Number")
    address = TextField(string="Official Address")


class ResPartner(Model):
    _name = "res.partner"
    _description = "Universal Contact (Customer, Vendor, Subscriber, Lead)"

    name = CharField(max_length=255, required=True, index=True, string="Partner Name")
    email = CharField(max_length=128, index=True, string="Email Address")
    phone = CharField(max_length=64, index=True, string="Phone / WhatsApp")
    address = TextField(string="Full Address")
    city = CharField(max_length=128, string="City")
    
    # Partner roles
    is_customer = BooleanField(default=True, string="Is a Customer")
    is_subscriber = BooleanField(default=False, string="Is a Broadband / Cloud Subscriber")
    is_vendor = BooleanField(default=False, string="Is a Vendor")


class IrSequence(Model):
    _name = "ir.sequence"
    _description = "Document Number Generator"

    code = CharField(max_length=64, required=True, index=True, string="Sequence Code")
    name = CharField(max_length=128, required=True, string="Sequence Name")
    prefix = CharField(max_length=32, default="", string="Prefix")
    padding = IntegerField(default=5, string="Number Padding")
    next_number = IntegerField(default=1, string="Next Number")

    def format_next(self) -> str:
        num_str = str(self.next_number).zfill(self.padding)
        formatted = f"{self.prefix}{num_str}"
        self.next_number += 1
        return formatted
