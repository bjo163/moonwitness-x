"""
Moonwitness ERP — Sales Models (product.template, sale.order, sale.order.line)
"""
from services.erp.core.registry import Model
from services.erp.core.fields import (
    CharField, TextField, MoneyField, DecimalField, Many2One, One2Many, Selection, DateTimeField
)


class ProductTemplate(Model):
    _name = "product.template"
    _company_scoped = False
    _description = "Product or Service Template"

    name = CharField(max_length=255, required=True, string="Product Name")
    code = CharField(max_length=64, index=True, string="Internal Reference / SKU")
    
    kind = Selection([
        ("one_off", "One-Off Product / Hardware / Service"),
        ("recurring", "Recurring Subscription Service")
    ], default="one_off", required=True, string="Product Kind")

    list_price = MoneyField(string="Sales Price")
    currency_code = CharField(max_length=8, default="IDR", string="Currency")
    
    billing_interval = Selection([
        ("monthly", "Monthly"),
        ("quarterly", "Quarterly"),
        ("annually", "Annually")
    ], default="monthly", string="Billing Interval")

    # Broadband specific technical profile (for RADIUS sync)
    rate_limit = CharField(max_length=64, string="MikroTik Rate Limit (e.g. 50M/50M)")
    description = TextField(string="Description")


class SaleOrder(Model):
    _name = "sale.order"
    _description = "Sales Order & Commercial Agreement"

    number = CharField(max_length=64, required=True, unique=True, index=True, string="Order Number")
    partner_id = Many2One("res.partner", required=True, string="Customer")
    
    state = Selection([
        ("draft", "Draft Quotation"),
        ("sent", "Quotation Sent"),
        ("confirmed", "Sales Order Confirmed"),
        ("cancelled", "Cancelled")
    ], default="draft", index=True, string="Order Status")

    order_date = DateTimeField(auto_now_add=True, string="Order Date")
    currency_code = CharField(max_length=8, default="IDR", string="Currency")
    total_amount = MoneyField(string="Total Amount")
    notes = TextField(string="Terms & Conditions")
    line_ids = One2Many("sale.order.line", inverse_field="order_id", string="Order Lines")


class SaleOrderLine(Model):
    _name = "sale.order.line"
    _description = "Sales Order Line Item"

    order_id = Many2One("sale.order", required=True, ondelete="CASCADE", string="Order Reference")
    product_id = Many2One("product.template", string="Product")
    name = CharField(max_length=255, required=True, string="Description")
    
    quantity = DecimalField(precision=18, scale=4, required=True, default="1", minimum=0, exclusive_minimum=True, string="Quantity")
    unit_price = MoneyField(string="Unit Price")
    subtotal = MoneyField(string="Subtotal")
    
    line_kind = Selection([
        ("one_off", "One-Off Item"),
        ("recurring", "Recurring Subscription Item")
    ], default="one_off", string="Line Kind")
