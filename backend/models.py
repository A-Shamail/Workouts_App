"""
Pydantic models for the LLM Workout Trainer API
"""
from datetime import datetime
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field
from enum import Enum

# Enums
class ExperienceLevel(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"

class ExerciseCategory(str, Enum):
    chest = "chest"
    back = "back"
    legs = "legs"
    shoulders = "shoulders"
    arms = "arms"
    core = "core"
    cardio = "cardio"

class DifficultyLevel(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"

class WorkoutDay(str, Enum):
    monday = "monday"
    tuesday = "tuesday"
    wednesday = "wednesday"
    thursday = "thursday"
    friday = "friday"

class Sentiment(str, Enum):
    positive = "positive"
    neutral = "neutral"
    negative = "negative"

# Base models
class Schedule(BaseModel):
    days_per_week: int = Field(default=5, ge=1, le=7)
    session_duration: int = Field(default=45, ge=15, le=120)
    preferred_times: List[str] = Field(default=["morning"])

class Constraints(BaseModel):
    injuries: List[str] = Field(default=[])
    limitations: List[str] = Field(default=[])

class Exercise(BaseModel):
    exercise_id: str
    name: str
    category: ExerciseCategory
    equipment_required: List[str]
    difficulty_level: DifficultyLevel
    instructions: str
    safety_notes: List[str] = Field(default=[])
    progressions: List[str] = Field(default=[])

class PlannedExercise(BaseModel):
    exercise_id: str
    exercise_name: str
    sets: int
    reps: str  # e.g., "8-12" or "10"
    rest_seconds: int
    target_rpe: int = Field(ge=1, le=10)
    notes: Optional[str] = None

class DayPlan(BaseModel):
    day: WorkoutDay
    focus: str
    exercises: List[PlannedExercise]
    estimated_duration: int

class CompletedExercise(BaseModel):
    exercise_id: str
    exercise_name: str
    completed_sets: int
    actual_reps: List[int]
    weight_used: Optional[float] = None
    rpe: int = Field(ge=1, le=10)
    notes: Optional[str] = None

class ExtractedInsights(BaseModel):
    fatigue_indicators: List[str] = Field(default=[])
    pain_flags: List[str] = Field(default=[])
    preferences: List[str] = Field(default=[])
    schedule_conflicts: List[str] = Field(default=[])

class ProgressionIndicators(BaseModel):
    strength_gains: bool = False
    endurance_improvements: bool = False
    form_quality: str = "stable"  # improving, stable, declining

# Request/Response models
class LoginRequest(BaseModel):
    user_id: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ProfileCreate(BaseModel):
    goals: List[str]
    experience_level: ExperienceLevel
    equipment: List[str]
    schedule: Schedule
    constraints: Constraints

class ProfileResponse(BaseModel):
    profile_id: str
    status: str
    message: str

class UserProfile(BaseModel):
    user_id: str
    goals: List[str]
    experience_level: ExperienceLevel
    equipment: List[str]
    schedule: Schedule
    constraints: Constraints
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class WorkoutPlan(BaseModel):
    plan_id: str
    user_id: str
    week_number: int
    created_at: datetime = Field(default_factory=datetime.utcnow)
    days: List[DayPlan]
    adaptation_rationale: Optional[str] = None

class PlanGenerationRequest(BaseModel):
    week_number: int = Field(ge=1)

class PlanGenerationResponse(BaseModel):
    plan_id: str
    status: str
    message: str

class WorkoutLogCreate(BaseModel):
    plan_id: str
    day: WorkoutDay
    exercises: List[CompletedExercise]
    session_rpe: int = Field(ge=1, le=10)
    duration_minutes: int
    general_feedback: Optional[str] = None

class WorkoutLog(BaseModel):
    log_id: str
    user_id: str
    plan_id: str
    day: WorkoutDay
    completed_at: datetime = Field(default_factory=datetime.utcnow)
    exercises: List[CompletedExercise]
    session_rpe: int
    duration_minutes: int
    general_feedback: Optional[str] = None

class LogResponse(BaseModel):
    log_id: str
    status: str
    message: str

class FeedbackCreate(BaseModel):
    week_number: int
    feedback_text: str

class UserFeedback(BaseModel):
    feedback_id: str
    user_id: str
    week_number: int
    feedback_text: str
    sentiment: Sentiment
    extracted_insights: ExtractedInsights
    submitted_at: datetime = Field(default_factory=datetime.utcnow)

class FeedbackResponse(BaseModel):
    feedback_id: str
    status: str
    message: str

class WeeklyMetrics(BaseModel):
    user_id: str
    week_number: int
    adherence_rate: float = Field(ge=0.0, le=1.0)
    average_rpe: float
    completed_sessions: int
    total_planned_sessions: int
    progression_indicators: ProgressionIndicators
    concerns: List[str] = Field(default=[])

class AdaptationResponse(BaseModel):
    adaptation_id: str
    rationale: str
    next_plan_id: str
    key_changes: List[str] = Field(default=[])

# LangGraph state model
class WorkoutState(BaseModel):
    user_profile: Optional[UserProfile] = None
    current_week: int = 1
    plan_history: List[WorkoutPlan] = Field(default=[])
    current_plan: Optional[WorkoutPlan] = None
    logs: List[WorkoutLog] = Field(default=[])
    feedback_analysis: Dict[str, Any] = Field(default={})
    metrics: Optional[WeeklyMetrics] = None
    adaptation_context: Dict[str, Any] = Field(default={})
    workflow_stage: str = "plan_generation"
    error_context: Optional[str] = None
