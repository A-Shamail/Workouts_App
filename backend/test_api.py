#!/usr/bin/env python3
"""
Quick test script to debug the API issue
"""
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from workout_engine import WorkoutEngine
from database import DatabaseManager
from models import *

async def test_plan_generation():
    print("🧪 Testing plan generation...")
    
    try:
        # Initialize database
        from database import init_db
        await init_db()
        print("✅ Database initialized")
        
        # Create test profile
        db = DatabaseManager()
        test_profile = UserProfile(
            user_id="test_user",
            goals=["strength"],
            experience_level=ExperienceLevel.beginner,
            equipment=["bodyweight"],
            schedule=Schedule(
                days_per_week=5,
                session_duration=45,
                preferred_times=["morning"]
            ),
            constraints=Constraints(
                injuries=[],
                limitations=[]
            )
        )
        
        await db.save_user_profile(test_profile)
        print("✅ Test profile saved")
        
        # Test plan generation
        engine = WorkoutEngine()
        plan = await engine.generate_plan("test_user", 1)
        print(f"✅ Plan generated successfully!")
        print(f"   Plan ID: {plan.plan_id}")
        print(f"   Days: {len(plan.days)}")
        print(f"   Week: {plan.week_number}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    result = asyncio.run(test_plan_generation())
    if result:
        print("🎉 Test passed!")
    else:
        print("💥 Test failed!")
