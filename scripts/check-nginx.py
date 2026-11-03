import paramiko

hostname = "81.0.248.108"
port = 22
username = "root"
password = "172885Moalin"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(hostname, port=port, username=username, password=password, timeout=15)
    cmd = "cat /etc/nginx/sites-enabled/* 2>/dev/null || cat /etc/nginx/conf.d/* 2>/dev/null"
    stdin, stdout, stderr = ssh.exec_command(cmd, get_pty=True)
    out = stdout.read().decode('utf-8', errors='replace')
    print("=== NGINX CONFIG ===")
    print(out.encode('ascii', errors='ignore').decode('ascii'))
finally:
    ssh.close()
