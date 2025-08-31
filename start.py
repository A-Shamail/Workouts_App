#!/usr/bin/env python3
"""
Startup script for LLM Workout Trainer
"""
import os
import sys
import subprocess
import time
import threading
from pathlib import Path

def run_backend():
    """Run the FastAPI backend"""
    print("🚀 Starting backend server...")
    
    # Save current directory to restore later
    original_dir = os.getcwd()
    
    try:
        os.chdir("backend")
        subprocess.run([sys.executable, "main.py"])
    except Exception as e:
        print(f"❌ Backend failed to start: {e}")
    finally:
        os.chdir(original_dir)

def run_frontend():
    """Run the React frontend"""
    print("🎨 Starting frontend server...")
    
    # Get the project root directory (where start.py is located)
    project_root = os.path.dirname(os.path.abspath(__file__))
    frontend_path = os.path.join(project_root, "frontend")
    
    try:
        # Check if frontend directory exists
        if not os.path.exists(frontend_path):
            print("❌ Frontend directory not found. Please ensure the frontend folder exists.")
            print(f"📍 Looking for: {frontend_path}")
            print("📁 Available directories in project root:")
            for item in os.listdir(project_root):
                if os.path.isdir(os.path.join(project_root, item)):
                    print(f"   - {item}")
            return
            
        os.chdir(frontend_path)
        
        # Install dependencies if node_modules doesn't exist
        if not os.path.exists("node_modules"):
            print("📦 Installing frontend dependencies...")
            subprocess.run(["npm", "install"])
        
        subprocess.run(["npm", "start"])
    except Exception as e:
        print(f"❌ Frontend failed to start: {e}")
    finally:
        os.chdir(project_root)

def check_env_file():
    """Check if .env file exists and has required variables"""
    env_path = Path("backend/.env")
    
    if not env_path.exists():
        print("⚠️  No .env file found in backend/")
        print("📝 Please create backend/.env with the following:")
        print("   GOOGLE_API_KEY=your_gemini_api_key_here")
        print("   JWT_SECRET_KEY=your_jwt_secret_key_here")
        print()
        
        create_env = input("Would you like to create a template .env file? (y/n): ")
        if create_env.lower() == 'y':
            with open("backend/.env", "w") as f:
                f.write("""# LLM Workout Trainer Environment Variables
GOOGLE_API_KEY=your_gemini_api_key_here
DATABASE_URL=sqlite:///./workout_trainer.db
JWT_SECRET_KEY=your_jwt_secret_key_here_make_it_long_and_random
FRONTEND_URL=http://localhost:3000
""")
            print("✅ Template .env file created in backend/")
            print("🔑 Please edit backend/.env and add your Google API key")
            return False
        else:
            return False
    
    # Check if API key is set
    try:
        with open(env_path) as f:
            content = f.read()
            if "your_gemini_api_key_here" in content:
                print("⚠️  Please update your Google API key in backend/.env")
                return False
    except:
        pass
    
    return True

def main():
    print("🏋️  LLM Workout Trainer Startup")
    print("================================")
    
    # Check environment setup
    if not check_env_file():
        print("❌ Environment setup required. Please complete setup and try again.")
        return
    
    print("✅ Environment looks good!")
    print()
    
    try:
        # Start backend in a separate thread
        backend_thread = threading.Thread(target=run_backend, daemon=True)
        backend_thread.start()
        
        # Wait a moment for backend to start
        print("⏳ Waiting for backend to start...")
        time.sleep(3)
        
        # Start frontend
        run_frontend()
        
    except KeyboardInterrupt:
        print("\n👋 Shutting down servers...")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
