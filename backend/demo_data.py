#!/usr/bin/env python3
"""
Demo data script for LLM Workout Trainer
Creates sample user profiles and workout plans for testing
"""
import asyncio
import uuid
from datetime import datetime, timedelta
from database import DatabaseManager, init_db
from models import *

async def create_demo_data():
    """Create demo data for testing the application"""
    print("🎯 Creating demo data...")
    
    # Initialize database
    await init_db()
    db = DatabaseManager()
    
    # Create demo user profile
    demo_profile = UserProfile(
        user_id="demo_user",
        goals=["strength", "endurance"],
        experience_level=ExperienceLevel.intermediate,
        equipment=["dumbbells", "bodyweight", "resistance_bands"],
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
    
    await db.save_user_profile(demo_profile)
    print(f"✅ Created demo user profile: {demo_profile.user_id}")
    
    # Create sample workout plan
    demo_plan = WorkoutPlan(
        plan_id=str(uuid.uuid4()),
        user_id="demo_user",
        week_number=1,
        days=[
            DayPlan(
                day=WorkoutDay.monday,
                focus="upper_body",
                exercises=[
                    PlannedExercise(
                        exercise_id="push_ups",
                        exercise_name="Push-ups",
                        sets=3,
                        reps="10-15",
                        rest_seconds=60,
                        target_rpe=7,
                        notes="Focus on controlled movement"
                    ),
                    PlannedExercise(
                        exercise_id="dumbbell_rows",
                        exercise_name="Dumbbell Rows",
                        sets=3,
                        reps="8-12",
                        rest_seconds=90,
                        target_rpe=8,
                        notes="Pull to chest, squeeze shoulder blades"
                    ),
                    PlannedExercise(
                        exercise_id="planks",
                        exercise_name="Plank Hold",
                        sets=3,
                        reps="30-60 seconds",
                        rest_seconds=60,
                        target_rpe=6,
                        notes="Keep straight body line"
                    )
                ],
                estimated_duration=40
            ),
            DayPlan(
                day=WorkoutDay.tuesday,
                focus="lower_body",
                exercises=[
                    PlannedExercise(
                        exercise_id="squats",
                        exercise_name="Bodyweight Squats",
                        sets=3,
                        reps="12-20",
                        rest_seconds=60,
                        target_rpe=7,
                        notes="Full depth, weight in heels"
                    ),
                    PlannedExercise(
                        exercise_id="lunges",
                        exercise_name="Forward Lunges",
                        sets=3,
                        reps="10 each leg",
                        rest_seconds=60,
                        target_rpe=7,
                        notes="Keep front knee over ankle"
                    )
                ],
                estimated_duration=35
            ),
            DayPlan(
                day=WorkoutDay.wednesday,
                focus="cardio",
                exercises=[
                    PlannedExercise(
                        exercise_id="jumping_jacks",
                        exercise_name="Jumping Jacks",
                        sets=4,
                        reps="30 seconds",
                        rest_seconds=30,
                        target_rpe=8,
                        notes="High intensity intervals"
                    )
                ],
                estimated_duration=25
            ),
            DayPlan(
                day=WorkoutDay.thursday,
                focus="upper_body",
                exercises=[
                    PlannedExercise(
                        exercise_id="push_ups",
                        exercise_name="Push-ups",
                        sets=3,
                        reps="12-18",
                        rest_seconds=60,
                        target_rpe=8,
                        notes="Increase reps from Monday"
                    )
                ],
                estimated_duration=30
            ),
            DayPlan(
                day=WorkoutDay.friday,
                focus="full_body",
                exercises=[
                    PlannedExercise(
                        exercise_id="squats",
                        exercise_name="Bodyweight Squats",
                        sets=2,
                        reps="15",
                        rest_seconds=45,
                        target_rpe=6,
                        notes="Light full body session"
                    ),
                    PlannedExercise(
                        exercise_id="push_ups",
                        exercise_name="Push-ups",
                        sets=2,
                        reps="10",
                        rest_seconds=45,
                        target_rpe=6,
                        notes="Focus on form"
                    )
                ],
                estimated_duration=25
            )
        ],
        adaptation_rationale="Initial plan based on intermediate level and equipment availability"
    )
    
    await db.save_workout_plan(demo_plan)
    print(f"✅ Created demo workout plan: Week {demo_plan.week_number}")
    
    # Create sample workout logs
    sample_logs = [
        WorkoutLog(
            log_id=str(uuid.uuid4()),
            user_id="demo_user",
            plan_id=demo_plan.plan_id,
            day=WorkoutDay.monday,
            exercises=[
                CompletedExercise(
                    exercise_id="push_ups",
                    exercise_name="Push-ups",
                    completed_sets=3,
                    actual_reps=[15, 12, 10],
                    weight_used=0,
                    rpe=7,
                    notes="Felt strong today"
                ),
                CompletedExercise(
                    exercise_id="dumbbell_rows",
                    exercise_name="Dumbbell Rows",
                    completed_sets=3,
                    actual_reps=[12, 10, 8],
                    weight_used=25,
                    rpe=8,
                    notes="Good mind-muscle connection"
                )
            ],
            session_rpe=7,
            duration_minutes=42,
            general_feedback="Great workout, feeling energized!",
            completed_at=datetime.now() - timedelta(days=2)
        ),
        WorkoutLog(
            log_id=str(uuid.uuid4()),
            user_id="demo_user",
            plan_id=demo_plan.plan_id,
            day=WorkoutDay.tuesday,
            exercises=[
                CompletedExercise(
                    exercise_id="squats",
                    exercise_name="Bodyweight Squats",
                    completed_sets=3,
                    actual_reps=[20, 18, 15],
                    weight_used=0,
                    rpe=7,
                    notes="Good depth on all reps"
                )
            ],
            session_rpe=6,
            duration_minutes=35,
            general_feedback="Legs felt a bit tight from yesterday",
            completed_at=datetime.now() - timedelta(days=1)
        )
    ]
    
    for log in sample_logs:
        await db.save_workout_log(log)
    
    print(f"✅ Created {len(sample_logs)} demo workout logs")
    
    print("🎉 Demo data creation complete!")
    print()
    print("You can now log in with user ID: 'demo_user'")
    print("The demo user has a workout plan and some logged workouts to explore.")

async def clear_demo_data():
    """Clear demo data from the database"""
    print("🧹 Clearing demo data...")
    # In a real implementation, you'd delete the demo user's data
    # For now, we'll just note that this would clear the demo_user data
    print("✅ Demo data cleared (note: implement actual deletion in production)")

async def main():
    print("🏋️  LLM Workout Trainer - Demo Data Manager")
    print("==========================================")
    print()
    print("1. Create demo data")
    print("2. Clear demo data")
    print("3. Exit")
    print()
    
    choice = input("Enter your choice (1-3): ").strip()
    
    if choice == "1":
        await create_demo_data()
    elif choice == "2":
        await clear_demo_data()
    elif choice == "3":
        print("👋 Goodbye!")
    else:
        print("❌ Invalid choice")

if __name__ == "__main__":
    asyncio.run(main())
