import paramiko
import os
import sys

hostname = "81.0.248.108"
port = 22
username = "root"
password = "172885Moalin"

files_to_upload = [
    ("app/telegram-mini-app/ActivityHistory.tsx", "/root/an-industory/app/telegram-mini-app/ActivityHistory.tsx"),
    ("app/telegram-mini-app/sales/page.tsx", "/root/an-industory/app/telegram-mini-app/sales/page.tsx"),
    ("app/api/telegram/sales/[id]/route.ts", "/root/an-industory/app/api/telegram/sales/[id]/route.ts"),
    ("app/api/telegram/production/[id]/route.ts", "/root/an-industory/app/api/telegram/production/[id]/route.ts")
]

print("Connecting to VPS...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(hostname, port=port, username=username, password=password, timeout=20)
    print("Connected successfully!")
    
    sftp = ssh.open_sftp()
    
    # Ensure remote dirs exist
    ssh.exec_command("mkdir -p /root/an-industory/app/api/telegram/sales/\\[id\\] /root/an-industory/app/api/telegram/production/\\[id\\]")
    
    for local_path, remote_path in files_to_upload:
        if os.path.exists(local_path):
            print(f"Uploading {local_path} -> {remote_path}...")
            sftp.put(local_path, remote_path)
            print("Uploaded!")
        else:
            print(f"Local file missing: {local_path}")
            
    sftp.close()

    print("\nExecuting Next.js build & PM2 restart on VPS...")
    cmd = (
        "cd /root/an-industory && "
        "npx prisma generate && "
        "export NODE_OPTIONS='--max-old-space-size=4096' && "
        "npm run build && "
        "cp -r public .next/standalone/ || true && "
        "cp -r .next/static .next/standalone/.next/ || true && "
        "pm2 restart 1 && "
        "pm2 restart 0 && "
        "pm2 status"
    )

    stdin, stdout, stderr = ssh.exec_command(cmd, get_pty=True)

    while True:
        line = stdout.readline()
        if not line:
            break
        print(line.encode('ascii', errors='ignore').decode('ascii'), end="")
        sys.stdout.flush()

    exit_code = stdout.channel.recv_exit_status()
    print(f"\nUpload & build completed with exit code: {exit_code}")

except Exception as e:
    print(f"Error: {e}")
finally:
    ssh.close()
