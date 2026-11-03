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
    ssh.connect(hostname, port=port, username=username, password=password, timeout=20)
    print("Connected successfully!")

    cmd = (
        "echo '=== 1. UNPACKING CLEAN TARBALL ===' && "
        "rm -rf /root/an-industory/app /root/an-industory/components /root/an-industory/contexts /root/an-industory/lib /root/an-industory/prisma /root/an-industory/types /root/an-industory/hooks /root/an-industory/scripts && "
        "tar -xzf /root/an_industory_deploy.tar.gz -C /root/an-industory && "
        "echo '=== 2. PRISMA GENERATE & DB PUSH ===' && "
        "cd /root/an-industory && npx prisma generate && "
        "echo '=== 3. BUILDING NEXT.JS ===' && "
        "cd /root/an-industory && export NODE_OPTIONS='--max-old-space-size=4096' && npm run build && "
        "echo '=== 4. COPYING ASSETS TO STANDALONE ===' && "
        "cd /root/an-industory && cp -r public .next/standalone/ || true && "
        "cd /root/an-industory && cp -r .next/static .next/standalone/.next/ || true && "
        "echo '=== 5. RESTARTING PM2 PROCESSES ===' && "
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
    print(f"\nClean full build completed with exit code: {exit_code}")

except Exception as e:
    print(f"Clean build error: {e}")
finally:
    ssh.close()
