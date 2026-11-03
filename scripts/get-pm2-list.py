import paramiko
import json

hostname = "81.0.248.108"
port = 22
username = "root"
password = "172885Moalin"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(hostname, port=port, username=username, password=password, timeout=15)

    cmd = "pm2 jlist"
    stdin, stdout, stderr = ssh.exec_command(cmd, get_pty=True)
    out = stdout.read().decode('utf-8', errors='replace')
    
    # parse JSON or print relevant fields
    apps = json.loads(out)
    for app in apps:
        name = app.get('name')
        pm2_env = app.get('pm2_env', {})
        cwd = pm2_env.get('pm_cwd')
        script = pm2_env.get('pm_exec_path')
        print(f"App: {name} | CWD: {cwd} | Script: {script}")
    
except Exception as e:
    print(f"Error: {e}")
finally:
    ssh.close()
