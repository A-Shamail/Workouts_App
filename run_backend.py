#!/usr/bin/env python3
"""
Simple script to run just the backend server
"""
import os
import sys
import subprocess

def main():
    print("🚀 Starting LLM Workout Trainer Backend")
    print("======================================")
    print("📍 Backend will run on: http://localhost:8000")
    print("📖 API docs available at: http://localhost:8000/docs")
    print()
    
    # Change to backend directory
    os.chdir("backend")
    
    # Run the server
    try:
        subprocess.run([sys.executable, "main.py"])
    except KeyboardInterrupt:
        print("\n👋 Backend server stopped")

if __name__ == "__main__":
    main()
