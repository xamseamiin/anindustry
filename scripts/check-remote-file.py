import paramiko

hostname = "81.0.248.108"
port = 22
username = "root"
password = "172885Moalin"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(hostname, port=port, username=username, password=password, timeout=15)
    cmd = "grep -n 'Edit' /root/an-industory/app/telegram-mini-app/ActivityHistory.tsx"
    stdin, stdout, stderr = ssh.exec_command(cmd, get_pty=True)
    out = stdout.read().decode('utf-8', errors='replace')
    print("=== REMOTE FILE GREP ===")
    print(out.encode('ascii', errors='ignore').decode('ascii'))
finally:
    ssh.close()
