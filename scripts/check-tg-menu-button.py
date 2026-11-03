import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

bot_token = "8860668642:AAEQVo3jd06vCB8ZlGM5-3PKdSunaHXK31k"

# 1. Get Chat Menu Button
url = f"https://api.telegram.org/bot{bot_token}/getChatMenuButton"
try:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, context=ctx) as res:
        data = json.loads(res.read().decode())
        print("=== TELEGRAM BOT MENU BUTTON ===")
        print(json.dumps(data, indent=2))
except Exception as e:
    print(f"Error getting menu button: {e}")

# 2. Check getMe
url_me = f"https://api.telegram.org/bot{bot_token}/getMe"
try:
    req = urllib.request.Request(url_me)
    with urllib.request.urlopen(req, context=ctx) as res:
        data = json.loads(res.read().decode())
        print("=== TELEGRAM BOT INFO ===")
        print(json.dumps(data, indent=2))
except Exception as e:
    print(f"Error getMe: {e}")
