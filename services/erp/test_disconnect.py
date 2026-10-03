import urllib.request
import urllib.error
import json

url = "http://localhost:5170/api/v1/radius/sessions/disconnect"
data = json.dumps({"username": "user_cv_mahakarya", "reason": "Test suspend"}).encode()
req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req) as res:
        print("Status:", res.status)
        print("Body:", res.read().decode())
except urllib.error.HTTPError as e:
    print("HTTPError:", e.code, e.read().decode())
except Exception as e:
    print("Error:", e)
