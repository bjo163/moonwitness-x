"""
Moonwitness ERP — Accounting & Invoicing Models (account.move, account.move.line)
"""
from services.erp.core.registry import Model
from services.erp.core.fields import (
    CharField, TextField, MoneyField, DecimalField, Many2One, One2Many, Selection,
    DateTimeField, JSONField,
)


class AccountMove(Model):
    _name = "account.move"
    _description = "Customer Invoice / Billing Statement"

    number = CharField(max_length=64, required=True, unique=True, index=True, string="Invoice Number")
    partner_id = Many2One("res.partner", required=True, string="Customer")
    source_order_id = Many2One("sale.order", string="Originating Sales Order")
    subscription_id = Many2One("sale.subscription", string="Originating Subscription")
    billing_period_start = DateTimeField(string="Billing Period Start")
    billing_period_end = DateTimeField(string="Billing Period End")
    idempotency_key = CharField(max_length=160, unique=True, string="Invoice Generation Key")
    customer_snapshot = JSONField(string="Immutable Customer Details Snapshot")
    
    invoice_date = DateTimeField(auto_now_add=True, string="Invoice Date")
    due_date = DateTimeField(string="Payment Due Date")
    
    currency_code = CharField(max_length=8, default="IDR", string="Currency")
    total_amount = MoneyField(string="Total Due")
    
    state = Selection([
        ("draft", "Draft"),
        ("posted", "Posted / Unpaid"),
        ("paid", "Paid in Full"),
        ("overdue", "Overdue"),
        ("cancelled", "Cancelled")
    ], default="draft", index=True, string="Invoice Status")

    payment_date = DateTimeField(string="Payment Timestamp")
    payment_method = CharField(max_length=64, string="Payment Method (e.g. Bank Transfer, Gateway)")
    payment_note = TextField(string="Payment Note / Reference")
    notes = TextField(string="Payment Instructions")
    line_ids = One2Many("account.move.line", inverse_field="move_id", string="Invoice Lines")


class AccountMoveLine(Model):
    _name = "account.move.line"
    _description = "Invoice Line Item"

    move_id = Many2One("account.move", required=True, ondelete="CASCADE", string="Invoice Reference")
    product_id = Many2One("product.template", string="Billed Product")
    name = CharField(max_length=255, required=True, string="Description")
    
    quantity = DecimalField(precision=18, scale=4, required=True, default="1", minimum=0, exclusive_minimum=True, string="Quantity")
    unit_price = MoneyField(string="Unit Price")
    subtotal = MoneyField(string="Line Subtotal")
