import json
import os
import requests
from pathlib import Path
from .auth import load_config

def get_proof(job_id):
    """Get proof for a job"""
    config = load_config()
    
    if not config.get("huggingface_token"):
        print("❌ No Hugging Face token found. Please run 'forg3t login' first.")
        return False
    
    if not config.get("linked"):
        print("❌ CLI session not linked to web dashboard. Please run 'forg3t link <PAIRING_CODE>' first.")
        return False
    
    # Get Supabase URL from environment or config
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Supabase configuration not found.")
        print("💡 Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.")
        return False
    
    # Call proof function
    proof_url = f"{supabase_url}/functions/v1/proof?job_id={job_id}"
    
    headers = {
        "Authorization": f"Bearer {supabase_key}",
        "User-Agent": "forg3t-cli/1.0 (compatible with huggingface-cli)"
    }
    
    try:
        print(f"🔍 Retrieving proof for job: {job_id}")
        
        response = requests.get(proof_url, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                proof_data = result.get("proof", {})
                print("✅ Proof retrieved successfully!")
                print(f"📋 Job ID: {job_id}")
                print(f"📝 Proof: {proof_data}")
                return True
            else:
                print(f"❌ Proof retrieval failed: {result.get('error', 'Unknown error')}")
                return False
        else:
            print(f"❌ Proof retrieval failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error during proof retrieval: {e}")
        return False