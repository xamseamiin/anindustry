import paramiko
import sys

hostname = "81.0.248.108"
port = 22
username = "root"
password = "172885Moalin"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    print("Connecting to VPS...")
    ssh.connect(hostname, port=port, username=username, password=password, timeout=15)
    print("Connected successfully!")

    cmd = (
        "echo '=== UNPACKING CODE ===' && "
        "tar -xzf /root/an_industory_deploy.tar.gz -C /root/an-industory && "
        "cd /root/an-industory && npx prisma generate && "
        "echo '=== BUILDING NEXT.JS APP ===' && "
        "export NODE_OPTIONS='--max-old-space-size=4096' && npm run build && "
        "echo '=== COPYING STANDALONE ASSETS ===' && "
        "cp -r public .next/standalone/ || true && "
        "cp -r .next/static .next/standalone/.next/ || true && "
        "echo '=== RESTARTING PM2 PROCESSES ===' && "
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
    print(f"\nFinal deploy exit status: {exit_code}")

except Exception as e:
    print(f"Deploy error: {e}")
finally:
    ssh.close()
