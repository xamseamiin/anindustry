import paramiko
import os
import sys

hostname = "81.0.248.108"
port = 22
username = "root"
password = "172885Moalin"

print("Connecting to VPS...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(hostname, port=port, username=username, password=password, timeout=20)
    print("Connected successfully!")
    
    sftp = ssh.open_sftp()
    
    # Create remote directories
    ssh.exec_command("mkdir -p /root/an-industory/prisma")
    
    # Upload prisma schema
    local_schema = "prisma/schema.prisma"
    remote_schema = "/root/an-industory/prisma/schema.prisma"
    if os.path.exists(local_schema):
        print(f"Uploading {local_schema} -> {remote_schema}...")
        sftp.put(local_schema, remote_schema)
        print("Schema uploaded!")
        
    sftp.close()

    print("\nRunning Prisma Generate, Next.js Build, and PM2 restart on VPS...")
    cmd = (
        "cd /root/an-industory && "
        "npx prisma generate && "
        "export NODE_OPTIONS='--max-old-space-size=4096' && "
        "npm run build && "
        "cp -r public .next/standalone/ || true && "
        "cp -r .next/static .next/standalone/.next/ || true && "
        "pm2 delete an-industory-nextjs || true && "
        "PORT=3001 pm2 start .next/standalone/server.js --name 'an-industory-nextjs' && "
        "pm2 restart an-industory-bot || true && "
        "pm2 save && "
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
    print(f"\nBuild repair completed with exit code: {exit_code}")

except Exception as e:
    print(f"Error: {e}")
finally:
    ssh.close()
