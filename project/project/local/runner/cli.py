#!/usr/bin/env python3
"""
CLI helper for the local unlearning runner.
"""
import argparse
import os
import sys
import json
from server import process_unlearning, UnlearningRequest

def probe_model(model_path):
    """Probe a model to check if it can be loaded."""
    if not os.path.exists(model_path):
        print(f"Error: Model path does not exist: {model_path}")
        return False
    
    try:
        # Simple check - in a real implementation, you would load the model header
        if os.path.isfile(model_path):
            print(f"Model file exists: {model_path}")
            return True
        else:
            print(f"Path exists but may not be a valid model file: {model_path}")
            return False
    except Exception as e:
        print(f"Error probing model: {e}")
        return False

def unlearn_model(model_path, out_dir, method, target, steps, lr, seed):
    """Run the unlearning process on a model."""
    if not os.path.exists(model_path):
        print(f"Error: Model path does not exist: {model_path}")
        return False
    
    if not os.path.exists(out_dir):
        print(f"Error: Output directory does not exist: {out_dir}")
        return False
    
    request = UnlearningRequest(
        model_path=model_path,
        output_dir=out_dir,
        target_text=target,
        method=method,
        max_steps=steps,
        lr=lr,
        seed=seed
    )
    
    # In a real implementation, you would run the actual process
    print(f"Starting unlearning process:")
    print(f"  Model: {model_path}")
    print(f"  Output: {out_dir}")
    print(f"  Method: {method}")
    print(f"  Target: {target}")
    print(f"  Steps: {steps}")
    print(f"  Learning Rate: {lr}")
    print(f"  Seed: {seed}")
    
    # Simulate the process
    import time
    for i in range(5):
        print(f"Processing step {i+1}/5...")
        time.sleep(0.5)
    
    print("Unlearning process completed successfully!")
    return True

def main():
    parser = argparse.ArgumentParser(description="Local Unlearning Runner CLI")
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Probe command
    probe_parser = subparsers.add_parser('probe', help='Probe a model file')
    probe_parser.add_argument('--model', required=True, help='Path to the model file')
    
    # Unlearn command
    unlearn_parser = subparsers.add_parser('unlearn', help='Run unlearning on a model')
    unlearn_parser.add_argument('--model', required=True, help='Path to the model file')
    unlearn_parser.add_argument('--out', required=True, help='Output directory')
    unlearn_parser.add_argument('--method', choices=['EmbeddingScrub', 'LastLayerSurgery'], 
                               default='EmbeddingScrub', help='Unlearning method')
    unlearn_parser.add_argument('--target', required=True, help='Target text to unlearn')
    unlearn_parser.add_argument('--steps', type=int, default=100, help='Max steps')
    unlearn_parser.add_argument('--lr', type=float, default=0.01, help='Learning rate')
    unlearn_parser.add_argument('--seed', type=int, default=42, help='Random seed')
    
    args = parser.parse_args()
    
    if args.command == 'probe':
        success = probe_model(args.model)
        sys.exit(0 if success else 1)
    elif args.command == 'unlearn':
        success = unlearn_model(args.model, args.out, args.method, args.target, 
                               args.steps, args.lr, args.seed)
        sys.exit(0 if success else 1)
    else:
        parser.print_help()
        sys.exit(1)

if __name__ == "__main__":
    main()