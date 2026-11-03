import socket

domain = "anindustry.online"
try:
    ip = socket.gethostbyname(domain)
    print(f"DNS Resolution: {domain} -> {ip}")
except Exception as e:
    print(f"DNS Error: {e}")
