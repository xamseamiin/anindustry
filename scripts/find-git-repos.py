import paramiko

hostname = "81.0.248.108"
port = 22
username = "root"
password = "172885Moalin"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(hostname, port=port, username=username, password=password, timeout=15)
    print("Connected!")

    cmd = "find /root /var/www -name '.git' -type d 2>/dev/null"
    stdin, stdout, stderr = ssh.exec_command(cmd, get_pty=True)
    out = stdout.read().decode('utf-8', errors='replace')
    print("=== GIT REPOS FOUND ===")
    print(out.encode('ascii', errors='ignore').decode('ascii'))
    
except Exception as e:
    print(f"Error: {e}")
finally:
    ssh.close()
