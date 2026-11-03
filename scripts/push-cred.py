import ctypes, subprocess, sys

# Read credential from Windows Credential Manager
class CREDENTIAL_ATTRIBUTE(ctypes.Structure):
    _fields_ = [("Keyword", ctypes.c_wchar_p), ("Flags", ctypes.c_ulong),
                ("ValueSize", ctypes.c_ulong), ("Value", ctypes.c_char_p)]

class CREDENTIAL(ctypes.Structure):
    _fields_ = [("Flags", ctypes.c_ulong), ("Type", ctypes.c_ulong),
                ("TargetName", ctypes.c_wchar_p), ("Comment", ctypes.c_wchar_p),
                ("LastWritten", ctypes.c_ulonglong), ("CredentialBlobSize", ctypes.c_ulong),
                ("CredentialBlob", ctypes.c_char_p), ("Persist", ctypes.c_ulong),
                ("AttributeCount", ctypes.c_ulong), ("Attributes", ctypes.POINTER(CREDENTIAL_ATTRIBUTE)),
                ("TargetAlias", ctypes.c_wchar_p), ("UserName", ctypes.c_wchar_p)]

advapi = ctypes.windll.advapi32
advapi.CredReadW.restype = ctypes.c_bool
advapi.CredReadW.argtypes = [ctypes.c_wchar_p, ctypes.c_ulong, ctypes.c_ulong, ctypes.POINTER(ctypes.POINTER(CREDENTIAL))]
advapi.CredFree.argtypes = [ctypes.c_void_p]

def read_cred(target):
    cred_ptr = ctypes.POINTER(CREDENTIAL)()
    if advapi.CredReadW(target, 1, 0, ctypes.byref(cred_ptr)):
        c = cred_ptr.contents
        username = c.UserName
        raw = c.CredentialBlob[:c.CredentialBlobSize]
        # Try UTF-16-LE first (GCM stores as UTF-16), fallback to UTF-8
        try:
            password = raw.decode('utf-16-le')
        except Exception:
            password = raw.decode('utf-8', errors='replace')
        advapi.CredFree(cred_ptr)
        return username, password
    return None, None

username, token = read_cred('git:https://github.com')
if not token:
    print("ERROR: No credential found for git:https://github.com")
    sys.exit(1)

print(f"Found credential for user: {username}")

# Push using token embedded in URL
push_url = f"https://{username}:{token}@github.com/xamseamiin/anindustry.git"
result = subprocess.run(
    ["git", "push", push_url, "main"],
    capture_output=True, text=True, timeout=90,
    cwd=r"c:\Users\OMEN\projects\An-Industory"
)
print("STDOUT:", result.stdout)
print("STDERR:", result.stderr)
print("Exit code:", result.returncode)
