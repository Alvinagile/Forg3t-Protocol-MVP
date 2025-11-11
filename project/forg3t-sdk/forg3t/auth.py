import json
import os
import requests
import uuid
from pathlib import Path
from huggingface_hub import whoami

# Configuration
FORG3T_DIR = Path.home() / ".forg3t"
CONFIG_FILE = FORG3T_DIR / "config.json"
HF_TOKEN_FILE = Path.home() / ".huggingface" / "token"
HF_CACHE_TOKEN_FILE = Path.home() / ".cache" / "huggingface" / "token"

def get_hf_token():
    """Read Hugging Face token from CLI cache"""
    # Check multiple possible locations for the token
    token_files = [
        HF_TOKEN_FILE,  # Standard location
        HF_CACHE_TOKEN_FILE,  # Cache location
        Path.home() / ".config" / "huggingface" / "token",  # Config location
    ]
    
    for token_file in token_files:
        if token_file.exists():
            try:
                with open(token_file, "r") as f:
                    token = f.read().strip()
                if token:
                    print(f"[OK] Found Hugging Face token in {token_file}")
                    return token
            except Exception as e:
                print(f"[WARN] Error reading token from {token_file}: {e}")
                continue
    
    # Also check environment variables
    env_vars = ["HF_TOKEN", "HUGGING_FACE_HUB_TOKEN"]
    for env_var in env_vars:
        token = os.environ.get(env_var)
        if token:
            print(f"[OK] Found Hugging Face token in environment variable {env_var}")
            return token.strip()
    
    # Try to get token from HfFolder (huggingface_hub's built-in method)
    try:
        from huggingface_hub import HfFolder
        token = HfFolder.get_token()
        if token:
            print("[OK] Found Hugging Face token using HfFolder.get_token()")
            return token
    except Exception as e:
        print(f"[WARN] Error getting token from HfFolder: {e}")
    
    return None

def verify_hf_token(token):
    """Verify Hugging Face token using CLI-like behavior"""
    try:
        # Try with Bearer prefix first (standard approach)
        print("[INFO] Verifying token with Bearer prefix...")
        user_info = whoami(token=f"Bearer {token}")
        return True, user_info
    except Exception as e1:
        print(f"[WARN] Bearer prefix failed: {e1}")
        try:
            # If that fails, try with raw token (CLI fallback behavior)
            print("[INFO] Verifying token with raw token (CLI fallback)...")
            user_info = whoami(token=token)
            return True, user_info
        except Exception as e2:
            print(f"[ERROR] Token verification failed: {e1} and {e2}")
            return False, None

def save_config(config):
    """Save configuration to file"""
    FORG3T_DIR.mkdir(exist_ok=True)
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=2)

def load_config():
    """Load configuration from file"""
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE, "r") as f:
            return json.load(f)
    return {}

def login():
    """Detect and verify Hugging Face CLI login"""
    print("[INFO] Detecting Hugging Face CLI login...")
    
    # Check for Hugging Face token
    token = get_hf_token()
    
    if not token:
        print("[ERROR] No Hugging Face token found.")
        print("[HELP] Please run 'huggingface-cli login' first to authenticate.")
        print("[HELP] Or set HF_TOKEN environment variable with your token.")
        return False
    
    print("[OK] Hugging Face token found. Verifying...")
    
    # Verify token
    is_valid, user_info = verify_hf_token(token)
    
    if not is_valid:
        print("[ERROR] Token verification failed.")
        print("[HELP] Please run 'huggingface-cli login' to refresh your credentials.")
        return False
    
    # Save verified info
    config = {
        "huggingface_token": token,
        "user": user_info.get("name", "unknown"),
        "linked": False,
        "device_id": str(uuid.uuid4())
    }
    
    save_config(config)
    
    print(f"[OK] Successfully logged in as {user_info.get('name', 'unknown')}")
    print("[HELP] Next step: Run 'forg3t link <PAIRING_CODE>' to connect with web dashboard")
    return True

def link_cli_session(pairing_code):
    """Link CLI session with web dashboard"""
    config = load_config()
    
    if not config.get("huggingface_token"):
        print("[ERROR] No Hugging Face token found. Please run 'forg3t login' first.")
        return False
    
    # Get Supabase URL from environment or config
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        print("[ERROR] Supabase configuration not found.")
        print("[HELP] Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.")
        return False
    
    # Call cli-link function
    link_url = f"{supabase_url}/functions/v1/cli-link"
    
    headers = {
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "User-Agent": "forg3t-cli/1.0 (compatible with huggingface-cli)"
    }
    
    payload = {
        "pairing_code": pairing_code,
        "device_id": config.get("device_id"),
        "huggingface_token": config.get("huggingface_token")
    }
    
    try:
        response = requests.post(link_url, json=payload, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                config["linked"] = True
                save_config(config)
                print("[OK] CLI session successfully linked with web dashboard!")
                print(f"[LINK] Linked to user: {result.get('user_id')}")
                return True
            else:
                print(f"[ERROR] Linking failed: {result.get('error', 'Unknown error')}")
                return False
        else:
            print(f"[ERROR] Linking failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"[ERROR] Error during linking: {e}")
        return False