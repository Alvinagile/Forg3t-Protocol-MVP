import json
import os
import requests
import time
from pathlib import Path
from .auth import load_config

def run_unlearn(model_name, target_text):
    """Run unlearning on a model"""
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
    
    # Call unlearn function
    unlearn_url = f"{supabase_url}/functions/v1/unlearn"
    
    headers = {
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "User-Agent": "forg3t-cli/1.0 (compatible with huggingface-cli)"
    }
    
    payload = {
        "model_name": model_name,
        "target_text": target_text,
        "huggingface_token": config.get("huggingface_token"),
        "user_id": config.get("device_id")  # Using device_id as user identifier for now
    }
    
    try:
        print(f"🚀 Starting unlearning process for model: {model_name}")
        print(f"🎯 Target text: {target_text}")
        
        response = requests.post(unlearn_url, json=payload, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                job_id = result.get("job_id")
                print(f"✅ Unlearning job started successfully!")
                print(f"📋 Job ID: {job_id}")
                print("⏳ Processing... (this may take a few minutes)")
                
                # Poll for job completion
                return poll_job_status(job_id, supabase_url, supabase_key)
            else:
                print(f"❌ Unlearning failed: {result.get('error', 'Unknown error')}")
                return False
        else:
            print(f"❌ Unlearning failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error during unlearning: {e}")
        return False

def poll_job_status(job_id, supabase_url, supabase_key):
    """Poll for job status"""
    job_status_url = f"{supabase_url}/functions/v1/job-status?jobId={job_id}"
    
    headers = {
        "Authorization": f"Bearer {supabase_key}",
        "User-Agent": "forg3t-cli/1.0 (compatible with huggingface-cli)"
    }
    
    max_attempts = 60  # 10 minutes with 10s intervals
    attempt = 0
    
    while attempt < max_attempts:
        try:
            response = requests.get(job_status_url, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                status = result.get("status", "unknown")
                
                if status == "completed":
                    print("✅ Unlearning completed successfully!")
                    print(f"📋 Job ID: {job_id}")
                    print(f"📊 Progress: {result.get('progress', 100)}%")
                    print(f"📝 Message: {result.get('message', 'Process completed')}")
                    return True
                elif status == "failed":
                    print("❌ Unlearning failed!")
                    print(f"📋 Job ID: {job_id}")
                    print(f"📝 Error: {result.get('message', 'Unknown error')}")
                    return False
                else:
                    progress = result.get("progress", 0)
                    message = result.get("message", "Processing...")
                    print(f"📊 Progress: {progress}% - {message}")
                    
            else:
                print(f"⚠️  Status check failed with status {response.status_code}")
                
        except Exception as e:
            print(f"⚠️  Error checking status: {e}")
        
        attempt += 1
        time.sleep(10)  # Wait 10 seconds before next check
    
    print("⏰ Unlearning process timed out. Please check the dashboard for status.")
    return False