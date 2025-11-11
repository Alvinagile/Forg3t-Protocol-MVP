import argparse
import json
import os
import sys
from pathlib import Path
from .auth import login, link_cli_session
from .unlearn import run_unlearn
from .proof import get_proof

def main():
    parser = argparse.ArgumentParser(description="Forg3t SDK for AI unlearning")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Login command
    login_parser = subparsers.add_parser("login", help="Detect and verify Hugging Face CLI login")

    # Link command
    link_parser = subparsers.add_parser("link", help="Link CLI session with web dashboard")
    link_parser.add_argument("pairing_code", help="Pairing code from web dashboard")

    # Unlearn command
    unlearn_parser = subparsers.add_parser("unlearn", help="Run unlearning on a model")
    unlearn_parser.add_argument("--model", required=True, help="Model name")
    unlearn_parser.add_argument("--target", required=True, help="Target text to unlearn")

    # Proof command
    proof_parser = subparsers.add_parser("proof", help="Get proof for a job")
    proof_parser.add_argument("job_id", help="Job ID to get proof for")

    args = parser.parse_args()

    if args.command == "login":
        login()
    elif args.command == "link":
        link_cli_session(args.pairing_code)
    elif args.command == "unlearn":
        run_unlearn(args.model, args.target)
    elif args.command == "proof":
        get_proof(args.job_id)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()