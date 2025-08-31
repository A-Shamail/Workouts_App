"""
Database setup and operations for LLM Workout Trainer
"""
import os
import sqlite3
import json
import aiosqlite
from datetime import datetime
from typing import List, Optional, Dict, Any
from models import *

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./workout_trainer.db")
DB_PATH = DATABASE_URL.replace("sqlite:///", "")

async def init_db():
    """Initialize the database with required tables"""
    async with aiosqlite.connect(DB_PATH) as db:
        # Users table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                goals TEXT,
                experience_level TEXT,
                equipment TEXT,
                schedule TEXT,
                constraints TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Exercises table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS exercises (
                exercise_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                equipment_required TEXT,
                difficulty_level TEXT,
                instructions TEXT,
                safety_notes TEXT,
                progressions TEXT
            )
        """)
        
        # Workout plans table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS workout_plans (
                plan_id TEXT PRIMARY KEY,
                user_id TEXT,
                week_number INTEGER,
                days TEXT,
                adaptation_rationale TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (user_id)
            )
        """)
        
        # Workout logs table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS workout_logs (
                log_id TEXT PRIMARY KEY,
                user_id TEXT,
                plan_id TEXT,
                day TEXT,
                exercises TEXT,
                session_rpe INTEGER,
                duration_minutes INTEGER,
                general_feedback TEXT,
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (user_id),
                FOREIGN KEY (plan_id) REFERENCES workout_plans (plan_id)
            )
        """)
        
        # Feedback table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS feedback (
                feedback_id TEXT PRIMARY KEY,
                user_id TEXT,
                week_number INTEGER,
                feedback_text TEXT,
                sentiment TEXT,
                extracted_insights TEXT,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (user_id)
            )
        """)
        
        # Metrics table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS weekly_metrics (
                user_id TEXT,
                week_number INTEGER,
                adherence_rate REAL,
                average_rpe REAL,
                completed_sessions INTEGER,
                total_planned_sessions INTEGER,
                progression_indicators TEXT,
                concerns TEXT,
                PRIMARY KEY (user_id, week_number),
                FOREIGN KEY (user_id) REFERENCES users (user_id)
            )
        """)
        
        await db.commit()
        
        # Insert sample exercises
        await insert_sample_exercises(db)

async def insert_sample_exercises(db):
    """Insert sample exercises into the database"""
    sample_exercises = [
        {
            "exercise_id": "push_ups",
            "name": "Push-ups",
            "category": "chest",
            "equipment_required": ["bodyweight"],
            "difficulty_level": "beginner",
            "instructions": "Start in plank position, lower chest to ground, push back up",
            "safety_notes": ["Keep core engaged", "Don't let hips sag"],
            "progressions": ["knee_pushups", "standard_pushups", "diamond_pushups"]
        },
        {
            "exercise_id": "squats",
            "name": "Bodyweight Squats",
            "category": "legs",
            "equipment_required": ["bodyweight"],
            "difficulty_level": "beginner",
            "instructions": "Stand with feet shoulder-width apart, lower hips back and down, return to standing",
            "safety_notes": ["Keep knees in line with toes", "Don't let knees cave inward"],
            "progressions": ["chair_squats", "bodyweight_squats", "jump_squats"]
        },
        {
            "exercise_id": "dumbbell_rows",
            "name": "Dumbbell Rows",
            "category": "back",
            "equipment_required": ["dumbbells"],
            "difficulty_level": "intermediate",
            "instructions": "Bend at hips, pull dumbbell to chest, control the descent",
            "safety_notes": ["Keep back straight", "Don't use momentum"],
            "progressions": ["light_weight", "moderate_weight", "heavy_weight"]
        },
        {
            "exercise_id": "planks",
            "name": "Plank Hold",
            "category": "core",
            "equipment_required": ["bodyweight"],
            "difficulty_level": "beginner",
            "instructions": "Hold plank position with straight body line",
            "safety_notes": ["Don't let hips sag", "Breathe normally"],
            "progressions": ["knee_plank", "standard_plank", "single_arm_plank"]
        },
        {
            "exercise_id": "lunges",
            "name": "Forward Lunges",
            "category": "legs",
            "equipment_required": ["bodyweight"],
            "difficulty_level": "intermediate",
            "instructions": "Step forward into lunge, lower back knee toward ground, return to start",
            "safety_notes": ["Keep front knee over ankle", "Don't let knee drift inward"],
            "progressions": ["stationary_lunges", "walking_lunges", "reverse_lunges"]
        }
    ]
    
    for exercise in sample_exercises:
        await db.execute("""
            INSERT OR IGNORE INTO exercises 
            (exercise_id, name, category, equipment_required, difficulty_level, instructions, safety_notes, progressions)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            exercise["exercise_id"],
            exercise["name"],
            exercise["category"],
            json.dumps(exercise["equipment_required"]),
            exercise["difficulty_level"],
            exercise["instructions"],
            json.dumps(exercise["safety_notes"]),
            json.dumps(exercise["progressions"])
        ))

class DatabaseManager:
    """Database operations manager"""
    
    @staticmethod
    async def save_user_profile(user_profile: UserProfile):
        """Save user profile to database"""
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute("""
                INSERT OR REPLACE INTO users 
                (user_id, goals, experience_level, equipment, schedule, constraints, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                user_profile.user_id,
                json.dumps(user_profile.goals),
                user_profile.experience_level.value,
                json.dumps(user_profile.equipment),
                user_profile.schedule.model_dump_json(),
                user_profile.constraints.model_dump_json(),
                datetime.utcnow().isoformat()
            ))
            await db.commit()
    
    @staticmethod
    async def get_user_profile(user_id: str) -> Optional[UserProfile]:
        """Get user profile from database"""
        async with aiosqlite.connect(DB_PATH) as db:
            async with db.execute("""
                SELECT user_id, goals, experience_level, equipment, schedule, constraints, created_at, updated_at
                FROM users WHERE user_id = ?
            """, (user_id,)) as cursor:
                row = await cursor.fetchone()
                if row:
                    return UserProfile(
                        user_id=row[0],
                        goals=json.loads(row[1]),
                        experience_level=row[2],
                        equipment=json.loads(row[3]),
                        schedule=Schedule.model_validate_json(row[4]),
                        constraints=Constraints.model_validate_json(row[5]),
                        created_at=datetime.fromisoformat(row[6]) if row[6] else datetime.utcnow(),
                        updated_at=datetime.fromisoformat(row[7]) if row[7] else datetime.utcnow()
                    )
                return None
    
    @staticmethod
    async def save_workout_plan(plan: WorkoutPlan):
        """Save workout plan to database"""
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute("""
                INSERT OR REPLACE INTO workout_plans 
                (plan_id, user_id, week_number, days, adaptation_rationale, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                plan.plan_id,
                plan.user_id,
                plan.week_number,
                json.dumps([day.model_dump() for day in plan.days]),
                plan.adaptation_rationale,
                plan.created_at.isoformat()
            ))
            await db.commit()
    
    @staticmethod
    async def get_workout_plan(plan_id: str) -> Optional[WorkoutPlan]:
        """Get workout plan from database"""
        async with aiosqlite.connect(DB_PATH) as db:
            async with db.execute("""
                SELECT plan_id, user_id, week_number, days, adaptation_rationale, created_at
                FROM workout_plans WHERE plan_id = ?
            """, (plan_id,)) as cursor:
                row = await cursor.fetchone()
                if row:
                    days_data = json.loads(row[3])
                    days = [DayPlan.model_validate(day) for day in days_data]
                    return WorkoutPlan(
                        plan_id=row[0],
                        user_id=row[1],
                        week_number=row[2],
                        days=days,
                        adaptation_rationale=row[4],
                        created_at=datetime.fromisoformat(row[5])
                    )
                return None
    
    @staticmethod
    async def get_current_plan(user_id: str) -> Optional[WorkoutPlan]:
        """Get current week's plan for user"""
        async with aiosqlite.connect(DB_PATH) as db:
            async with db.execute("""
                SELECT plan_id, user_id, week_number, days, adaptation_rationale, created_at
                FROM workout_plans 
                WHERE user_id = ? 
                ORDER BY week_number DESC, created_at DESC 
                LIMIT 1
            """, (user_id,)) as cursor:
                row = await cursor.fetchone()
                if row:
                    days_data = json.loads(row[3])
                    days = [DayPlan.model_validate(day) for day in days_data]
                    return WorkoutPlan(
                        plan_id=row[0],
                        user_id=row[1],
                        week_number=row[2],
                        days=days,
                        adaptation_rationale=row[4],
                        created_at=datetime.fromisoformat(row[5])
                    )
                return None
    
    @staticmethod
    async def save_workout_log(log: WorkoutLog):
        """Save workout log to database"""
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute("""
                INSERT INTO workout_logs 
                (log_id, user_id, plan_id, day, exercises, session_rpe, duration_minutes, general_feedback, completed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                log.log_id,
                log.user_id,
                log.plan_id,
                log.day.value,
                json.dumps([ex.model_dump() for ex in log.exercises]),
                log.session_rpe,
                log.duration_minutes,
                log.general_feedback,
                log.completed_at.isoformat()
            ))
            await db.commit()
    
    @staticmethod
    async def get_week_logs(user_id: str, week_number: int) -> List[WorkoutLog]:
        """Get all logs for a specific week"""
        # This would require joining with workout_plans to get week_number
        # For simplicity, we'll implement a basic version
        async with aiosqlite.connect(DB_PATH) as db:
            async with db.execute("""
                SELECT wl.log_id, wl.user_id, wl.plan_id, wl.day, wl.exercises, 
                       wl.session_rpe, wl.duration_minutes, wl.general_feedback, wl.completed_at
                FROM workout_logs wl
                JOIN workout_plans wp ON wl.plan_id = wp.plan_id
                WHERE wl.user_id = ? AND wp.week_number = ?
            """, (user_id, week_number)) as cursor:
                rows = await cursor.fetchall()
                logs = []
                for row in rows:
                    exercises_data = json.loads(row[4])
                    exercises = [CompletedExercise.model_validate(ex) for ex in exercises_data]
                    logs.append(WorkoutLog(
                        log_id=row[0],
                        user_id=row[1],
                        plan_id=row[2],
                        day=WorkoutDay(row[3]),
                        exercises=exercises,
                        session_rpe=row[5],
                        duration_minutes=row[6],
                        general_feedback=row[7],
                        completed_at=datetime.fromisoformat(row[8])
                    ))
                return logs
    
    @staticmethod
    async def get_exercises_by_category(category: str) -> List[Exercise]:
        """Get exercises by category"""
        async with aiosqlite.connect(DB_PATH) as db:
            async with db.execute("""
                SELECT exercise_id, name, category, equipment_required, difficulty_level, 
                       instructions, safety_notes, progressions
                FROM exercises WHERE category = ?
            """, (category,)) as cursor:
                rows = await cursor.fetchall()
                exercises = []
                for row in rows:
                    exercises.append(Exercise(
                        exercise_id=row[0],
                        name=row[1],
                        category=ExerciseCategory(row[2]),
                        equipment_required=json.loads(row[3]),
                        difficulty_level=DifficultyLevel(row[4]),
                        instructions=row[5],
                        safety_notes=json.loads(row[6]),
                        progressions=json.loads(row[7])
                    ))
                return exercises

async def get_db():
    """Dependency to get database connection"""
    # For now, we'll return a database manager instance
    # In a more complex setup, this would return an actual connection
    return DatabaseManager()
