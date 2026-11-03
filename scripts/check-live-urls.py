import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

urls = [
    "https://anindustry.online",
    "https://anindustry.online/manufacturing/sales",
    "https://anindustry.online/manufacturing/production-orders"
]

for url in urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
            print(f"URL: {url} -> Status: {response.status}")
    except Exception as e:
        print(f"URL: {url} -> Error: {e}")
