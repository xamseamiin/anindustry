import paramiko
import sys
import time

hostname = "81.0.248.108"
port = 22
username = "root"
password = "172885Moalin$"

command = "cd /root/an-industory && git pull origin main && npm run build && pm2 restart all"

print(f"Connecting to {username}@{hostname}...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(hostname, port=port, username=username, password=password, timeout=30)
    print("SSH Connection established successfully!")
    print(f"Executing command: {command}\n")

    stdin, stdout, stderr = ssh.exec_command(command, get_pty=True)

    while True:
        line = stdout.readline()
        if not line:
            break
        print(line, end="")
        sys.stdout.flush()

    exit_status = stdout.channel.recv_exit_status()
    print(f"\nCommand completed with exit code: {exit_status}")

except Exception as e:
    print(f"Error executing deployment: {e}")
    sys.exit(1)
finally:
    ssh.close()
