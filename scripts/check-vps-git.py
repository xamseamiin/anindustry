import paramiko
import sys

hostname = "81.0.248.108"
port = 22
username = "root"
password = "172885Moalin"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(hostname, port=port, username=username, password=password, timeout=15)
    print("Connected to VPS!")

    cmd = "cd /root/an-industory && git status && git log -1 --oneline"
    stdin, stdout, stderr = ssh.exec_command(cmd, get_pty=True)
    out = stdout.read().decode('utf-8', errors='replace')
    print(out.encode('ascii', errors='ignore').decode('ascii'))
    
except Exception as e:
    print(f"Error: {e}")
finally:
    ssh.close()
