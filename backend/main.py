"""
FastAPI backend for LLM Workout Trainer
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from dotenv import load_dotenv

from database import init_db, get_db
from models import *
from auth import get_current_user, create_access_token
from workout_engine import WorkoutEngine

# Load environment variables
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown
    pass

app = FastAPI(
    title="LLM Workout Trainer API",
    description="AI-powered personalized workout planning and adaptation",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize workout engine
workout_engine = WorkoutEngine()

@app.get("/")
async def root():
    return {"message": "LLM Workout Trainer API", "version": "1.0.0"}

# Authentication endpoints
@app.post("/api/auth/login", response_model=TokenResponse)
async def login(login_data: LoginRequest, db = Depends(get_db)):
    """Simple login - in a real app you'd verify credentials"""
    # For demo purposes, just create a token for any user_id
    access_token = create_access_token(data={"sub": login_data.user_id})
    return TokenResponse(access_token=access_token, token_type="bearer")

# Profile endpoints
@app.post("/api/profile", response_model=ProfileResponse)
async def create_profile(
    profile: ProfileCreate,
    current_user: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Create or update user profile"""
    try:
        # Create UserProfile object
        user_profile = UserProfile(
            user_id=current_user,
            goals=profile.goals,
            experience_level=profile.experience_level,
            equipment=profile.equipment,
            schedule=profile.schedule,
            constraints=profile.constraints
        )
        
        # Save to database
        await db.save_user_profile(user_profile)
        
        return ProfileResponse(
            profile_id=current_user,
            status="created",
            message="Profile created successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/profile/{user_id}", response_model=UserProfile)
async def get_profile(
    user_id: str,
    current_user: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get user profile"""
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Demo data - in real implementation, fetch from database
    return UserProfile(
        user_id=user_id,
        goals=["strength", "endurance"],
        experience_level="intermediate",
        equipment=["dumbbells", "resistance_bands"],
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

# Plan endpoints
@app.post("/api/plans/generate", response_model=PlanGenerationResponse)
async def generate_plan(
    request: PlanGenerationRequest,
    current_user: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Generate a new workout plan using LangGraph + Gemini"""
    try:
        print(f"🔍 Generating plan for user: {current_user}, week: {request.week_number}")
        
        # Check if user profile exists
        profile = await db.get_user_profile(current_user)
        if not profile:
            print(f"❌ No profile found for user: {current_user}")
            # Create a default profile for demo purposes
            default_profile = UserProfile(
                user_id=current_user,
                goals=["general_fitness"],
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
            await db.save_user_profile(default_profile)
            print(f"✅ Created default profile for user: {current_user}")
        
        plan = await workout_engine.generate_plan(current_user, request.week_number)
        print(f"✅ Plan generated successfully: {plan.plan_id}")
        
        return PlanGenerationResponse(
            plan_id=plan.plan_id,
            status="generated",
            message="Workout plan generated successfully"
        )
    except Exception as e:
        print(f"❌ Plan generation error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Plan generation failed: {str(e)}")

@app.get("/api/plans/{plan_id}", response_model=WorkoutPlan)
async def get_plan(
    plan_id: str,
    current_user: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get workout plan by ID"""
    plan = await workout_engine.get_plan(plan_id, current_user)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan

@app.get("/api/plans/user/{user_id}/current", response_model=WorkoutPlan)
async def get_current_plan(
    user_id: str,
    current_user: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get current week's plan for user"""
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Access denied")
    
    plan = await workout_engine.get_current_plan(user_id)
    if not plan:
        raise HTTPException(status_code=404, detail="No current plan found")
    return plan

# Logging endpoints
@app.post("/api/logs", response_model=LogResponse)
async def create_workout_log(
    log: WorkoutLogCreate,
    current_user: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Log workout completion"""
    try:
        log_id = await workout_engine.log_workout(current_user, log)
        return LogResponse(
            log_id=log_id,
            status="recorded",
            message="Workout logged successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/logs/user/{user_id}/week/{week_number}")
async def get_week_logs(
    user_id: str,
    week_number: int,
    current_user: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get all logs for a specific week"""
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Access denied")
    
    logs = await workout_engine.get_week_logs(user_id, week_number)
    return logs

# Feedback endpoints
@app.post("/api/feedback", response_model=FeedbackResponse)
async def submit_feedback(
    feedback: FeedbackCreate,
    current_user: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Submit workout feedback"""
    try:
        feedback_id = await workout_engine.process_feedback(current_user, feedback)
        return FeedbackResponse(
            feedback_id=feedback_id,
            status="processed",
            message="Feedback processed successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Adaptation endpoints
@app.post("/api/adapt/{user_id}/week/{week_number}", response_model=AdaptationResponse)
async def adapt_plan(
    user_id: str,
    week_number: int,
    current_user: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Generate adapted plan for next week"""
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        adaptation = await workout_engine.adapt_plan(user_id, week_number)
        return adaptation
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Calendar export
@app.get("/api/export/calendar/{plan_id}")
async def export_calendar(
    plan_id: str,
    current_user: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Export workout plan as ICS calendar file"""
    try:
        ics_file = await workout_engine.export_calendar(plan_id, current_user)
        return FileResponse(
            ics_file,
            media_type="text/calendar",
            filename=f"workout_plan_{plan_id}.ics"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
