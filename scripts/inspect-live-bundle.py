import urllib.request
import re
import ssl
import time

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "https://anindustry.online/telegram-mini-app/sales?t=" + str(int(time.time()))
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache'})

with urllib.request.urlopen(req, context=ctx) as res:
    html = res.read().decode('utf-8', errors='ignore')

chunks = list(set(re.findall(r'/_next/static/chunks/[^"\']+\.js', html)))
print(f"Total chunks found: {len(chunks)}")

found_modern = False
for c in chunks:
    chunk_url = f"https://anindustry.online{c}"
    try:
        req_c = urllib.request.Request(chunk_url, headers={'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache'})
        with urllib.request.urlopen(req_c, context=ctx) as res_c:
            js = res_c.read().decode('utf-8', errors='ignore')
            if "cyan-500/15" in js or "Edit Sale" in js:
                print(f"MATCH: {c}")
                print(f"  Has Edit Sale: {'Edit Sale' in js}")
                print(f"  Has Modern Cyan Glass: {'cyan-500/15' in js}")
                print(f"  Has Modern Ruby Glass: {'rose-500/15' in js}")
                if "cyan-500/15" in js:
                    found_modern = True
    except Exception as e:
        print(f"  {c} -> {e}")

if found_modern:
    print("SUCCESS: Modern design is LIVE on Vercel!")
else:
    print("WAITING: Vercel is still building or deploying commit 8c33cc48...")
