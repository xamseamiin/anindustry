import paramiko
import sys

hostname = "81.0.248.108"
port = 22
username = "root"

passwords = [
    "172885Moalin$",
    "172885moalin$",
    "172885Moalin",
    "172885moalin",
    "Moalin172885$",
    "Moalin$172885"
]

command = "cd /root/an-industory && git pull origin main && npm run build && pm2 restart all"

successful_pass = None

for pw in passwords:
    print(f"Testing password variation...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(hostname, port=port, username=username, password=pw, timeout=10)
        print(f"SUCCESS! Connected with password!")
        successful_pass = pw
        
        print(f"Running command: {command}\n")
        stdin, stdout, stderr = ssh.exec_command(command, get_pty=True)
        
        while True:
            line = stdout.readline()
            if not line:
                break
            print(line, end="")
            sys.stdout.flush()

        exit_code = stdout.channel.recv_exit_status()
        print(f"\nDeployment completed with exit status: {exit_code}")
        ssh.close()
        break
    except paramiko.AuthenticationException:
        print("Auth failed for this variation.")
        ssh.close()
    except Exception as e:
        print(f"Error: {e}")
        ssh.close()

if not successful_pass:
    print("ALL_AUTH_FAILED")
