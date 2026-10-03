"""
End-to-end integration test for Moonwitness ERP service.
Tests: Partners -> Products -> Create Order -> Confirm -> Subscription -> Invoice -> Outbox -> Suspend
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

import urllib.request
import urllib.error
import json
import time

BASE = "http://localhost:5180/api/v1/erp"
RADIUS_BASE = "http://localhost:5170/api/v1/radius"

def get(url):
    with urllib.request.urlopen(url) as res:
        return json.loads(res.read().decode())

def post(url, data):
    body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode())

print("=" * 60)
print("MOONWITNESS ERP - END-TO-END INTEGRATION TEST")
print("=" * 60)

# 1. Fetch master data
print("\n[1] FETCHING PARTNERS & PRODUCTS...")
partners = get(f"{BASE}/partners")
products = get(f"{BASE}/products")

customer = partners[0]
hw_product = next((p for p in products if p["kind"] == "one_off"), None)
sub_product = next((p for p in products if p["kind"] == "recurring"), None)

print(f"    Customer: {customer['name']}")
print(f"    Hardware: {hw_product['name']} @ Rp {hw_product['list_price']}")
print(f"    Recurring: {sub_product['name']} @ Rp {sub_product['list_price']}/bln")

# 2. Create Sales Order
print("\n[2] CREATING SALES ORDER...")
order_payload = {
    "partner_id": customer["id"],
    "notes": "Fiber Optic Dedicated 50 Mbps - SLA 99.5%",
    "lines": [
        {
            "product_id": hw_product["id"],
            "name": hw_product["name"],
            "quantity": 1,
            "unit_price": hw_product["list_price"],
            "line_kind": "one_off"
        },
        {
            "product_id": sub_product["id"],
            "name": sub_product["name"],
            "quantity": 1,
            "unit_price": sub_product["list_price"],
            "line_kind": "recurring"
        }
    ]
}
order = post(f"{BASE}/orders", order_payload)
print(f"    Order Created: {order['number']}")
print(f"    Total Amount: Rp {order['total_amount']}")
print(f"    Status: {order['state']}")

# 3. Confirm Order (spawns subscription + invoice + outbox event)
print("\n[3] CONFIRMING ORDER...")
confirm = post(f"{BASE}/orders/{order['id']}/confirm", {})

subscription = confirm.get("subscription")
invoice = confirm.get("invoice")

print(f"    Order Status: {confirm['order']['state']}")
if subscription:
    print(f"    Spawned Subscription: {subscription['number']}")
    print(f"    MRR: Rp {subscription['mrr']} | State: {subscription['state']}")
    print(f"    Technical: {subscription.get('technical_service')} | Profile: {subscription.get('technical_profile')}")
    print(f"    PPPoE User: {subscription.get('technical_reference')}")
if invoice:
    print(f"    Generated Invoice: {invoice['number']}")
    print(f"    Total Due: Rp {invoice['total_amount']} | Status: {invoice['state']}")

# 4. Verify Transactional Outbox
print("\n[4] CHECKING TRANSACTIONAL OUTBOX (waiting 3s for dispatcher)...")
time.sleep(3)
outbox = get(f"{BASE}/outbox")
if outbox:
    evt = outbox[0]
    print(f"    Event Type: {evt['eventType']}")
    print(f"    Target Service: {evt['targetService']}")
    print(f"    Status: {evt['status']} | Attempts: {evt['attempts']}/{evt['maxAttempts']}")
    if evt.get("lastError"):
        print(f"    Last Error: {evt['lastError']}")
else:
    print("    No outbox events found!")

# 5. Check RADIUS directly
print("\n[5] CHECKING RADIUS SUBSCRIBER SYNC (:5170)...")
try:
    radius_data = get(f"{RADIUS_BASE}/subscribers")
    # API returns {"subscribers": [...]} shape
    radius_subs = radius_data if isinstance(radius_data, list) else radius_data.get("subscribers", [])
    radius_username = customer.get("radius_username")
    synced = next((s for s in radius_subs if s.get("username") == radius_username), None)
    if synced:
        print(f"    ✅ SYNCED: username={synced['username']} profile={synced.get('profileId')} status={synced.get('status')}")
    else:
        print(f"    ⚠️  NOT FOUND: '{radius_username}' among: {[s['username'] for s in radius_subs[:5]]}")
except Exception as e:
    print(f"    RADIUS check error: {e}")


# 6. Suspend subscription (triggers CoA kick outbox event)
if subscription:
    print("\n[6] SUSPENDING SUBSCRIPTION (RFC 3576 CoA Kick)...")
    suspend_res = post(
        f"{BASE}/subscriptions/{subscription['id']}/suspend",
        {"reason": "Payment grace period expired - 7 days overdue"}
    )
    print(f"    Result: {suspend_res.get('message')}")
    time.sleep(3)
    outbox_after = get(f"{BASE}/outbox")
    if outbox_after:
        latest = outbox_after[0]
        print(f"    Latest Outbox Event: {latest['eventType']} | Status: {latest['status']}")

# 7. Final Overview KPIs
print("\n[7] ERP OVERVIEW KPIs...")
overview = get(f"{BASE}/overview")
print(f"    MRR:                  Rp {overview['mrr']}")
print(f"    Active Subscriptions: {overview['activeSubscriptions']}")
print(f"    Total Customers:      {overview['totalCustomers']}")
print(f"    Open CRM Leads:       {overview['openLeads']}")
print(f"    Unpaid Invoices:      Rp {overview['totalUnpaidInvoices']}")
print(f"    Outbox Stats:         {overview['outbox']}")
print(f"    Compiled Models:      {len(overview['compiledModels'])} models")
print(f"    Models: {overview['compiledModels']}")

print("\n" + "=" * 60)
print("END-TO-END TEST COMPLETE")
print("=" * 60)
