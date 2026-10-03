"""
Moonwitness ERP — Subscription Models (sale.subscription, subscription.line, subscription.event)
"""
from services.erp.core.registry import Model
from services.erp.core.fields import (
    CharField, TextField, MoneyField, DecimalField, Many2One, One2Many, Selection, DateTimeField, BooleanField, IntegerField
)


class SaleSubscription(Model):
    _name = "sale.subscription"
    _description = "Continuous Subscription Contract & MRR Engine"

    number = CharField(max_length=64, required=True, unique=True, index=True, string="Subscription Number")
    partner_id = Many2One("res.partner", required=True, string="Subscriber / Customer")
    source_order_id = Many2One("sale.order", string="Source Sales Order")
    
    state = Selection([
        ("draft", "Draft"),
        ("pending_activation", "Pending Technical Activation"),
        ("active", "Active / Normal Service"),
        ("past_due", "Past Due / In Grace Period"),
        ("suspended", "Suspended / Service Halted"),
        ("isolated", "Isolated / Walled Garden"),
        ("paused", "Paused / Vacation Hold"),
        ("cancelled", "Cancelled / Churned")
    ], default="draft", index=True, string="Subscription State")

    currency_code = CharField(max_length=8, default="IDR", string="Currency")
    mrr = MoneyField(string="Monthly Recurring Revenue (MRR)")
    
    billing_interval = Selection([
        ("monthly", "Monthly"),
        ("quarterly", "Quarterly"),
        ("annually", "Annually")
    ], default="monthly", string="Billing Interval")

    billing_timezone = CharField(max_length=64, default="UTC", string="IANA Billing Timezone")
    billing_anchor_day = IntegerField(default=1, minimum=1, maximum=31, string="Original Local Billing Day")

    current_period_start = DateTimeField(string="Current Period Start")
    current_period_end = DateTimeField(string="Current Period End")
    next_invoice_at = DateTimeField(string="Next Invoice Date")
    grace_until = DateTimeField(string="Grace Deadline")

    # Technical service routing
    technical_service = Selection([
        ("isp_radius", "Broadband PPPoE / Hotspot (RADIUS)"),
        ("cloud_runner", "Cloud Workload / Docker Container (Runner)"),
        ("general", "General Service")
    ], default="isp_radius", string="Technical Service Type")

    technical_reference = CharField(max_length=128, string="Technical Identifier (PPPoE User / Container ID)")
    technical_profile = CharField(max_length=64, string="Technical Profile / Rate Limit")
    line_ids = One2Many("subscription.line", inverse_field="subscription_id", string="Subscription Lines")
    event_ids = One2Many("subscription.event", inverse_field="subscription_id", string="Lifecycle Events")


class SubscriptionLine(Model):
    _name = "subscription.line"
    _description = "Subscription Recurring Service Line"

    subscription_id = Many2One("sale.subscription", required=True, ondelete="CASCADE", string="Subscription")
    product_id = Many2One("product.template", string="Service Product")
    name = CharField(max_length=255, required=True, string="Description")
    
    quantity = DecimalField(precision=18, scale=4, required=True, default="1", minimum=0, exclusive_minimum=True, string="Quantity")
    unit_price = MoneyField(string="Recurring Rate")
    subtotal = MoneyField(string="Subtotal")


class SubscriptionEvent(Model):
    _name = "subscription.event"
    _description = "Subscription Lifecycle Audit Event"

    subscription_id = Many2One("sale.subscription", required=True, ondelete="CASCADE", string="Subscription")
    event_type = CharField(max_length=64, required=True, string="Event Type") # e.g. ACTIVATED, SUSPENDED, UPGRADED
    timestamp = DateTimeField(auto_now_add=True, string="Event Timestamp")
    previous_state = CharField(max_length=32, string="Previous Subscription State")
    new_state = CharField(max_length=32, string="New Subscription State")
    actor = CharField(max_length=128, default="system", string="Transition Actor")
    reason = TextField(string="Transition Reason")
    note = TextField(string="Event Details / Actor / Reason")
