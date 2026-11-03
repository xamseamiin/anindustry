import os
import tarfile
import paramiko
import sys
import time

VPS_HOST = '81.0.248.108'
VPS_USER = 'root'
VPS_PASS = '172885Moalin'
REMOTE_DIR = '/root/an-industory'
LOCAL_TARBALL = 'an_industory_deploy.tar.gz'

print("1. Creating local tarball an_industory_deploy.tar.gz...")

ignored_dirs = {'node_modules', '.git', '.next', 'dist', 'output', 'tmp'}

if os.path.exists(LOCAL_TARBALL):
    os.remove(LOCAL_TARBALL)

with tarfile.open(LOCAL_TARBALL, "w:gz") as tar:
    for root, dirs, files in os.walk("."):
        # filter ignored directories in-place
        dirs[:] = [d for d in dirs if d not in ignored_dirs and not d.startswith('.next-stale')]
        for file in files:
            file_path = os.path.join(root, file)
            if file == LOCAL_TARBALL:
                continue
            tar.add(file_path)

print(f"Tarball created successfully! Size: {os.path.getsize(LOCAL_TARBALL) / (1024*1024):.2f} MB")

print("2. Connecting to VPS via SSH...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(VPS_HOST, port=22, username=VPS_USER, password=VPS_PASS, timeout=30)
    print("SSH connection established!")
    
    sftp = ssh.open_sftp()
    print("Uploading .env to /root/an-industory/.env...")
    if os.path.exists('.env'):
        sftp.put('.env', f'{REMOTE_DIR}/.env')
        print(".env uploaded successfully!")

    print(f"Uploading {LOCAL_TARBALL} to /root/{LOCAL_TARBALL}...")
    sftp.put(LOCAL_TARBALL, f'/root/{LOCAL_TARBALL}')
    print("Tarball upload complete!")
    sftp.close()

    deploy_commands = [
        'echo "=== STARTING AN INDUSTRY DEPLOYMENT ==="',
        'rm -rf /root/an-industory/app /root/an-industory/components /root/an-industory/contexts /root/an-industory/lib /root/an-industory/prisma /root/an-industory/types /root/an-industory/hooks /root/an-industory/scripts',
        'find /root/an-industory/public -mindepth 1 -maxdepth 1 ! -name "uploads" -exec rm -rf {} + || true',
        'tar -xzf /root/an_industory_deploy.tar.gz -C /root/an-industory',
        'cd /root/an-industory && npm install --legacy-peer-deps',
        'cd /root/an-industory && npx prisma generate',
        'cd /root/an-industory && npx prisma db push --accept-data-loss',
        'cd /root/an-industory && export NODE_OPTIONS="--max-old-space-size=4096" && npm run build',
        'cd /root/an-industory && cp -r public .next/standalone/ || true',
        'cd /root/an-industory && cp -r .next/static .next/standalone/.next/ || true',
        'pm2 delete an-industory-nextjs || true',
        'cd /root/an-industory && PORT=3001 pm2 start .next/standalone/server.js --name "an-industory-nextjs"',
        'pm2 restart an-industory-bot || true',
        'pm2 save',
        'echo "=== PM2 STATUS ==="',
        'pm2 status'
    ]

    full_cmd = " && ".join(deploy_commands)
    print("\nExecuting remote build & deployment sequence on VPS...")

    stdin, stdout, stderr = ssh.exec_command(full_cmd, get_pty=True)

    while True:
        line = stdout.readline()
        if not line:
            break
        print(line.encode('ascii', errors='ignore').decode('ascii'), end="")
        sys.stdout.flush()

    exit_status = stdout.channel.recv_exit_status()
    print(f"\nDeployment completed with exit code: {exit_status}")

except Exception as e:
    print(f"Deployment error: {e}")
    sys.exit(1)
finally:
    ssh.close()
    if os.path.exists(LOCAL_TARBALL):
        os.remove(LOCAL_TARBALL)
