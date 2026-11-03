import subprocess
import sys

print("Starting git push origin main...")
try:
    result = subprocess.run(
        ["git", "push", "origin", "main"],
        capture_output=True,
        text=True,
        timeout=60
    )
    print("STDOUT:")
    print(result.stdout)
    print("STDERR:")
    print(result.stderr)
    print("Exit code:", result.returncode)
except subprocess.TimeoutExpired:
    print("Timeout expired after 60s!")
except Exception as e:
    print(f"Exception: {e}")
