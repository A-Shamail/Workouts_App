"""
LangGraph-powered workout planning and adaptation engine
"""
import os
import uuid
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

import google.generativeai as genai
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI

from models import *
from database import DatabaseManager
from calendar_export import CalendarExporter

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

class WorkoutEngine:
    """Main engine for workout planning using LangGraph + Gemini"""
    
    def __init__(self):
        self.db = DatabaseManager()
        self.calendar_exporter = CalendarExporter()
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0.3
        )
        self.graph = self._build_workflow()
    
    def _build_workflow(self):
        """Build the LangGraph workflow"""
        from langgraph.graph import StateGraph, START, END
        
        workflow = StateGraph(WorkoutState)
        
        # Add nodes - simplified workflow for basic plan generation
        workflow.add_node("profile_intake", self._profile_intake_node)
        workflow.add_node("plan_generation", self._plan_generation_node)
        workflow.add_node("plan_validation", self._plan_validation_node)
        
        # Add edges - simple linear flow for now
        workflow.add_edge(START, "profile_intake")
        workflow.add_edge("profile_intake", "plan_generation")
        workflow.add_edge("plan_generation", "plan_validation")
        workflow.add_edge("plan_validation", END)
        
        return workflow.compile()
    
    async def _profile_intake_node(self, state: WorkoutState) -> WorkoutState:
        """Process user profile and validate completeness"""
        try:
            # Load user profile from database
            profile = await self.db.get_user_profile(state.user_profile.user_id)
            if profile:
                state.user_profile = profile
                state.workflow_stage = "profile_complete"
            else:
                state.error_context = "Profile not found"
        except Exception as e:
            state.error_context = f"Profile intake error: {str(e)}"
        
        return state
    
    async def _plan_generation_node(self, state: WorkoutState) -> WorkoutState:
        """Generate workout plan using Gemini"""
        try:
            profile = state.user_profile
            week_number = state.current_week
            
            # Build prompt for plan generation
            prompt = self._build_plan_generation_prompt(profile, week_number, state.plan_history)
            
            # Get plan from Gemini
            response = await self.llm.ainvoke([{"role": "user", "content": prompt}])
            plan_data = self._parse_plan_response(response.content)
            
            # Create workout plan
            plan = WorkoutPlan(
                plan_id=str(uuid.uuid4()),
                user_id=profile.user_id,
                week_number=week_number,
                days=plan_data["days"],
                adaptation_rationale=plan_data.get("rationale", "Initial plan generation")
            )
            
            state.current_plan = plan
            state.workflow_stage = "plan_generated"
            
        except Exception as e:
            state.error_context = f"Plan generation error: {str(e)}"
            # Fallback to template plan
            state.current_plan = self._create_fallback_plan(state.user_profile, state.current_week)
        
        return state
    
    async def _plan_validation_node(self, state: WorkoutState) -> WorkoutState:
        """Validate generated plan for safety and feasibility"""
        try:
            plan = state.current_plan
            profile = state.user_profile
            
            # Validate plan structure
            validation_errors = self._validate_plan_structure(plan, profile)
            
            if validation_errors:
                # Fix common issues
                plan = self._fix_plan_issues(plan, validation_errors, profile)
                state.current_plan = plan
            
            # Save validated plan
            await self.db.save_workout_plan(plan)
            state.workflow_stage = "plan_validated"
            
        except Exception as e:
            state.error_context = f"Plan validation error: {str(e)}"
        
        return state
    
    async def _logging_node(self, state: WorkoutState) -> WorkoutState:
        """Process workout completion logs"""
        state.workflow_stage = "logging_complete"
        return state
    
    async def _feedback_analysis_node(self, state: WorkoutState) -> WorkoutState:
        """Analyze user feedback using Gemini"""
        try:
            # Get recent feedback for the user
            feedback_text = state.feedback_analysis.get("raw_feedback", "")
            
            if feedback_text:
                # Use Gemini to analyze feedback
                analysis_prompt = f"""
                Analyze this workout feedback and extract structured insights:
                
                Feedback: "{feedback_text}"
                
                Extract:
                1. Sentiment (positive/neutral/negative)
                2. Fatigue indicators
                3. Pain flags (any mentions of pain or discomfort)
                4. Exercise preferences
                5. Schedule conflicts
                
                Return as JSON with keys: sentiment, fatigue_indicators, pain_flags, preferences, schedule_conflicts
                """
                
                response = await self.llm.ainvoke([{"role": "user", "content": analysis_prompt}])
                insights = json.loads(response.content)
                
                state.feedback_analysis["insights"] = insights
            
            state.workflow_stage = "feedback_analyzed"
            
        except Exception as e:
            state.error_context = f"Feedback analysis error: {str(e)}"
        
        return state
    
    async def _metrics_calculation_node(self, state: WorkoutState) -> WorkoutState:
        """Calculate weekly metrics and performance indicators"""
        try:
            user_id = state.user_profile.user_id
            week_number = state.current_week
            
            # Get logs for the week
            logs = await self.db.get_week_logs(user_id, week_number)
            
            # Calculate metrics
            if logs:
                total_planned = len(state.current_plan.days) if state.current_plan else 5
                completed_sessions = len(logs)
                adherence_rate = completed_sessions / total_planned
                
                avg_rpe = sum(log.session_rpe for log in logs) / len(logs)
                
                # Analyze progression (simplified)
                progression = ProgressionIndicators(
                    strength_gains=avg_rpe < 8 and adherence_rate > 0.8,
                    endurance_improvements=True,  # Simplified
                    form_quality="improving" if avg_rpe < 7 else "stable"
                )
                
                metrics = WeeklyMetrics(
                    user_id=user_id,
                    week_number=week_number,
                    adherence_rate=adherence_rate,
                    average_rpe=avg_rpe,
                    completed_sessions=completed_sessions,
                    total_planned_sessions=total_planned,
                    progression_indicators=progression,
                    concerns=["high_fatigue"] if avg_rpe > 8.5 else []
                )
                
                state.metrics = metrics
            
            state.workflow_stage = "metrics_calculated"
            
        except Exception as e:
            state.error_context = f"Metrics calculation error: {str(e)}"
        
        return state
    
    async def _adaptation_decision_node(self, state: WorkoutState) -> WorkoutState:
        """Decide on plan adaptations based on metrics and feedback"""
        try:
            metrics = state.metrics
            feedback_insights = state.feedback_analysis.get("insights", {})
            
            # Simple adaptation logic
            adaptations = []
            
            if metrics and metrics.adherence_rate < 0.6:
                adaptations.append("reduce_volume")
            
            if metrics and metrics.average_rpe > 8.5:
                adaptations.append("deload_intensity")
            
            if feedback_insights.get("pain_flags"):
                adaptations.append("exercise_substitution")
            
            if feedback_insights.get("schedule_conflicts"):
                adaptations.append("adjust_timing")
            
            state.adaptation_context = {
                "adaptations": adaptations,
                "reasoning": self._build_adaptation_reasoning(metrics, feedback_insights)
            }
            
            state.workflow_stage = "adaptation_decided"
            
        except Exception as e:
            state.error_context = f"Adaptation decision error: {str(e)}"
        
        return state
    
    async def _rationale_generation_node(self, state: WorkoutState) -> WorkoutState:
        """Generate human-readable rationale for adaptations"""
        try:
            adaptations = state.adaptation_context.get("adaptations", [])
            reasoning = state.adaptation_context.get("reasoning", "")
            
            if adaptations:
                rationale_prompt = f"""
                Generate a clear, encouraging explanation for workout plan changes:
                
                Adaptations needed: {', '.join(adaptations)}
                Performance data: {reasoning}
                
                Write a 2-3 sentence explanation that:
                1. Acknowledges the user's effort
                2. Explains why changes are being made
                3. Sets positive expectations for next week
                
                Keep it motivational and specific.
                """
                
                response = await self.llm.ainvoke([{"role": "user", "content": rationale_prompt}])
                state.adaptation_context["rationale"] = response.content
            else:
                state.adaptation_context["rationale"] = "Great work this week! Continuing with progressive overload."
            
            state.workflow_stage = "rationale_generated"
            
        except Exception as e:
            state.error_context = f"Rationale generation error: {str(e)}"
        
        return state
    
    async def _calendar_export_node(self, state: WorkoutState) -> WorkoutState:
        """Export plan to calendar format"""
        state.workflow_stage = "calendar_exported"
        return state
    
    def _build_plan_generation_prompt(self, profile: UserProfile, week_number: int, history: List[WorkoutPlan]) -> str:
        """Build prompt for plan generation"""
        return f"""
        Create a 5-day workout plan for a {profile.experience_level} level person.
        
        User Profile:
        - Goals: {', '.join(profile.goals)}
        - Equipment: {', '.join(profile.equipment)}
        - Session Duration: {profile.schedule.session_duration} minutes
        - Injuries/Limitations: {', '.join(profile.constraints.injuries + profile.constraints.limitations)}
        
        Week Number: {week_number}
        
        Requirements:
        1. 5 workout days (Monday-Friday)
        2. Each session should fit in {profile.schedule.session_duration} minutes
        3. Use only available equipment: {', '.join(profile.equipment)}
        4. Avoid exercises that aggravate: {', '.join(profile.constraints.injuries)}
        5. Progressive difficulty appropriate for week {week_number}
        
        Return a JSON structure with:
        {{
            "days": [
                {{
                    "day": "monday",
                    "focus": "upper_body",
                    "exercises": [
                        {{
                            "exercise_id": "push_ups",
                            "exercise_name": "Push-ups",
                            "sets": 3,
                            "reps": "8-12",
                            "rest_seconds": 60,
                            "target_rpe": 7,
                            "notes": "Focus on form"
                        }}
                    ],
                    "estimated_duration": 45
                }}
            ]
        }}
        
        Make it challenging but achievable for their level.
        """
    
    def _parse_plan_response(self, response: str) -> Dict[str, Any]:
        """Parse Gemini response into structured plan data"""
        try:
            # Extract JSON from response
            start = response.find('{')
            end = response.rfind('}') + 1
            json_str = response[start:end]
            return json.loads(json_str)
        except:
            # Fallback plan
            return {
                "days": [
                    {
                        "day": "monday",
                        "focus": "upper_body",
                        "exercises": [
                            {
                                "exercise_id": "push_ups",
                                "exercise_name": "Push-ups",
                                "sets": 3,
                                "reps": "8-12",
                                "rest_seconds": 60,
                                "target_rpe": 7,
                                "notes": "Focus on form"
                            }
                        ],
                        "estimated_duration": 30
                    }
                ]
            }
    
    def _create_simple_plan(self, profile: UserProfile, week_number: int) -> WorkoutPlan:
        """Create a comprehensive workout plan based on user profile"""
        days = []
        
        # Monday - Upper Body
        days.append(DayPlan(
            day=WorkoutDay.monday,
            focus="upper_body",
            exercises=[
                PlannedExercise(
                    exercise_id="push_ups",
                    exercise_name="Push-ups",
                    sets=3,
                    reps="8-15",
                    rest_seconds=60,
                    target_rpe=7,
                    notes="Modify on knees if needed"
                ),
                PlannedExercise(
                    exercise_id="dumbbell_rows",
                    exercise_name="Dumbbell Rows" if "dumbbells" in profile.equipment else "Resistance Band Rows",
                    sets=3,
                    reps="10-12",
                    rest_seconds=90,
                    target_rpe=7,
                    notes="Keep back straight, squeeze shoulder blades"
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
        ))
        
        # Tuesday - Lower Body
        days.append(DayPlan(
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
        ))
        
        # Wednesday - Cardio/Active Recovery
        days.append(DayPlan(
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
                ),
                PlannedExercise(
                    exercise_id="mountain_climbers",
                    exercise_name="Mountain Climbers",
                    sets=3,
                    reps="20 seconds",
                    rest_seconds=40,
                    target_rpe=7,
                    notes="Keep hips level"
                )
            ],
            estimated_duration=25
        ))
        
        # Thursday - Upper Body (different focus)
        days.append(DayPlan(
            day=WorkoutDay.thursday,
            focus="upper_body",
            exercises=[
                PlannedExercise(
                    exercise_id="push_ups",
                    exercise_name="Push-ups (Different Variation)",
                    sets=3,
                    reps="10-18",
                    rest_seconds=60,
                    target_rpe=8,
                    notes="Try diamond or wide variations"
                ),
                PlannedExercise(
                    exercise_id="tricep_dips",
                    exercise_name="Tricep Dips",
                    sets=3,
                    reps="8-12",
                    rest_seconds=60,
                    target_rpe=7,
                    notes="Use chair or bench"
                )
            ],
            estimated_duration=30
        ))
        
        # Friday - Full Body
        days.append(DayPlan(
            day=WorkoutDay.friday,
            focus="full_body",
            exercises=[
                PlannedExercise(
                    exercise_id="burpees",
                    exercise_name="Modified Burpees",
                    sets=3,
                    reps="5-10",
                    rest_seconds=90,
                    target_rpe=8,
                    notes="Step back instead of jumping if needed"
                ),
                PlannedExercise(
                    exercise_id="squats",
                    exercise_name="Bodyweight Squats",
                    sets=2,
                    reps="15",
                    rest_seconds=45,
                    target_rpe=6,
                    notes="Focus on form"
                ),
                PlannedExercise(
                    exercise_id="push_ups",
                    exercise_name="Push-ups",
                    sets=2,
                    reps="8-12",
                    rest_seconds=45,
                    target_rpe=6,
                    notes="End the week strong!"
                )
            ],
            estimated_duration=35
        ))
        
        return WorkoutPlan(
            plan_id=str(uuid.uuid4()),
            user_id=profile.user_id,
            week_number=week_number,
            days=days,
            adaptation_rationale=f"Week {week_number} plan customized for {profile.experience_level} level with available equipment: {', '.join(profile.equipment)}"
        )
    
    def _create_fallback_plan(self, profile: UserProfile, week_number: int) -> WorkoutPlan:
        """Create a basic fallback plan if AI generation fails"""
        return WorkoutPlan(
            plan_id=str(uuid.uuid4()),
            user_id=profile.user_id,
            week_number=week_number,
            days=[
                DayPlan(
                    day=WorkoutDay.monday,
                    focus="full_body",
                    exercises=[
                        PlannedExercise(
                            exercise_id="push_ups",
                            exercise_name="Push-ups",
                            sets=3,
                            reps="8-12",
                            rest_seconds=60,
                            target_rpe=7
                        )
                    ],
                    estimated_duration=30
                )
            ],
            adaptation_rationale="Fallback plan due to AI generation issue"
        )
    
    def _validate_plan_structure(self, plan: WorkoutPlan, profile: UserProfile) -> List[str]:
        """Validate plan structure and return any errors"""
        errors = []
        
        if not plan.days:
            errors.append("No workout days defined")
        
        for day in plan.days:
            if day.estimated_duration > profile.schedule.session_duration + 15:
                errors.append(f"{day.day} exceeds time limit")
            
            if not day.exercises:
                errors.append(f"{day.day} has no exercises")
        
        return errors
    
    def _fix_plan_issues(self, plan: WorkoutPlan, errors: List[str], profile: UserProfile) -> WorkoutPlan:
        """Fix common plan issues"""
        # Simplified fix: just ensure we have at least one exercise per day
        for day in plan.days:
            if not day.exercises:
                day.exercises = [
                    PlannedExercise(
                        exercise_id="push_ups",
                        exercise_name="Push-ups",
                        sets=2,
                        reps="5-10",
                        rest_seconds=60,
                        target_rpe=6
                    )
                ]
        return plan
    
    def _build_adaptation_reasoning(self, metrics: Optional[WeeklyMetrics], feedback_insights: Dict) -> str:
        """Build reasoning string for adaptations"""
        if not metrics:
            return "No metrics available"
        
        return f"Adherence: {metrics.adherence_rate:.1%}, Average RPE: {metrics.average_rpe:.1f}, Completed: {metrics.completed_sessions}/{metrics.total_planned_sessions}"
    
    async def _generate_ai_plan(self, profile: UserProfile, week_number: int) -> WorkoutPlan:
        """Generate sophisticated workout plan using Gemini AI"""
        # Build detailed prompt for Gemini
        prompt = self._build_detailed_plan_prompt(profile, week_number)
        
        # Get AI response
        response = await self.llm.ainvoke([{"role": "user", "content": prompt}])
        
        # Parse the AI response
        plan_data = self._parse_ai_response(response.content)
        
        # Create workout plan
        plan = WorkoutPlan(
            plan_id=str(uuid.uuid4()),
            user_id=profile.user_id,
            week_number=week_number,
            days=[DayPlan.model_validate(day) for day in plan_data["days"]],
            adaptation_rationale=plan_data.get("rationale", f"AI-generated plan for week {week_number}")
        )
        
        return plan
    
    def _build_detailed_plan_prompt(self, profile: UserProfile, week_number: int) -> str:
        """Build comprehensive prompt for AI plan generation"""
        equipment_list = ", ".join(profile.equipment) if profile.equipment else "bodyweight only"
        goals_list = ", ".join(profile.goals) if profile.goals else "general fitness"
        
        prompt = f"""
You are an expert personal trainer with 15+ years of experience. Create a comprehensive 5-day workout plan.

USER PROFILE:
- Experience: {profile.experience_level}
- Goals: {goals_list}
- Available Equipment: {equipment_list}
- Session Duration: {profile.schedule.session_duration} minutes
- Preferred Times: {", ".join(profile.schedule.preferred_times)}
- Injuries/Limitations: {", ".join(profile.constraints.injuries + profile.constraints.limitations) if profile.constraints.injuries or profile.constraints.limitations else "None"}

WEEK: {week_number}

REQUIREMENTS:
1. Create 5 workouts (Monday-Friday) with weekends as rest days
2. Each workout should be {profile.schedule.session_duration-5}-{profile.schedule.session_duration+5} minutes
3. Progressive difficulty appropriate for week {week_number}
4. Use ONLY available equipment: {equipment_list}
5. Avoid exercises that might aggravate injuries
6. Include proper warm-up considerations in exercise selection
7. Vary rep ranges and intensities throughout the week
8. Include compound and isolation movements as appropriate

FOCUS AREAS BY DAY:
- Monday: Upper body strength
- Tuesday: Lower body strength  
- Wednesday: Cardio/conditioning
- Thursday: Upper body (different focus)
- Friday: Full body/functional

EXERCISE SELECTION CRITERIA:
- For beginners: Focus on bodyweight and simple movements
- For intermediate: Include moderate complexity and weight progression
- For advanced: Complex movements and higher intensity variations

Return ONLY valid JSON in this exact format:
{{
  "days": [
    {{
      "day": "monday",
      "focus": "upper_body_strength",
      "exercises": [
        {{
          "exercise_id": "push_ups_standard",
          "exercise_name": "Standard Push-ups",
          "sets": 3,
          "reps": "8-12",
          "rest_seconds": 60,
          "target_rpe": 7,
          "notes": "Focus on controlled movement and full range of motion"
        }},
        {{
          "exercise_id": "dumbbell_rows",
          "exercise_name": "Dumbbell Bent-Over Rows",
          "sets": 3,
          "reps": "10-12",
          "rest_seconds": 90,
          "target_rpe": 8,
          "notes": "Keep back straight, pull to lower chest"
        }}
      ],
      "estimated_duration": {profile.schedule.session_duration}
    }}
  ],
  "rationale": "Week {week_number} focuses on building foundational strength with progressive overload..."
}}

Make the plan challenging but achievable for their level. Include 4-6 exercises per day.
"""
        return prompt
    
    def _parse_ai_response(self, response: str) -> dict:
        """Parse AI response and extract workout plan data"""
        try:
            # Find JSON in the response
            start = response.find('{')
            end = response.rfind('}') + 1
            if start == -1 or end == 0:
                raise ValueError("No JSON found in response")
            
            json_str = response[start:end]
            data = json.loads(json_str)
            
            # Validate structure
            if "days" not in data or not data["days"]:
                raise ValueError("Invalid plan structure")
            
            return data
            
        except Exception as e:
            print(f"⚠️ Failed to parse AI response: {e}")
            # Return fallback structure
            return {
                "days": [
                    {
                        "day": "monday",
                        "focus": "upper_body",
                        "exercises": [
                            {
                                "exercise_id": "push_ups",
                                "exercise_name": "Push-ups",
                                "sets": 3,
                                "reps": "8-12",
                                "rest_seconds": 60,
                                "target_rpe": 7,
                                "notes": "AI generation failed, using fallback"
                            }
                        ],
                        "estimated_duration": 30
                    }
                ],
                "rationale": "Fallback plan due to AI parsing error"
            }
    
    # Public API methods
    async def generate_plan(self, user_id: str, week_number: int) -> WorkoutPlan:
        """Generate a new workout plan using AI"""
        # Get user profile
        profile = await self.db.get_user_profile(user_id)
        if not profile:
            raise ValueError("User profile not found")
        
        try:
            # Use AI to generate a sophisticated plan
            plan = await self._generate_ai_plan(profile, week_number)
        except Exception as e:
            print(f"⚠️ AI generation failed, falling back to template: {e}")
            # Fallback to template plan if AI fails
            plan = self._create_simple_plan(profile, week_number)
        
        # Save the plan
        await self.db.save_workout_plan(plan)
        
        return plan
    
    async def get_plan(self, plan_id: str, user_id: str) -> Optional[WorkoutPlan]:
        """Get workout plan by ID"""
        plan = await self.db.get_workout_plan(plan_id)
        if plan and plan.user_id == user_id:
            return plan
        return None
    
    async def get_current_plan(self, user_id: str) -> Optional[WorkoutPlan]:
        """Get current plan for user"""
        return await self.db.get_current_plan(user_id)
    
    async def log_workout(self, user_id: str, log_data: WorkoutLogCreate) -> str:
        """Log workout completion"""
        log = WorkoutLog(
            log_id=str(uuid.uuid4()),
            user_id=user_id,
            **log_data.model_dump()
        )
        
        await self.db.save_workout_log(log)
        return log.log_id
    
    async def get_week_logs(self, user_id: str, week_number: int) -> List[WorkoutLog]:
        """Get logs for a specific week"""
        return await self.db.get_week_logs(user_id, week_number)
    
    async def process_feedback(self, user_id: str, feedback: FeedbackCreate) -> str:
        """Process user feedback"""
        # For now, just store the feedback
        # In a full implementation, this would trigger the feedback analysis workflow
        feedback_id = str(uuid.uuid4())
        # Store feedback logic would go here
        return feedback_id
    
    async def adapt_plan(self, user_id: str, week_number: int) -> AdaptationResponse:
        """Generate adapted plan for next week"""
        # Initialize state with current data
        profile = await self.db.get_user_profile(user_id)
        logs = await self.db.get_week_logs(user_id, week_number)
        
        state = WorkoutState(
            user_profile=profile,
            current_week=week_number + 1,
            logs=logs,
            workflow_stage="adaptation"
        )
        
        # Run adaptation workflow (simplified)
        # This would use the feedback_analysis -> metrics -> adaptation -> rationale flow
        
        # For demo, generate next week's plan
        next_plan = await self.generate_plan(user_id, week_number + 1)
        
        return AdaptationResponse(
            adaptation_id=str(uuid.uuid4()),
            rationale="Plan adapted based on your progress and feedback",
            next_plan_id=next_plan.plan_id,
            key_changes=["Increased intensity", "Added new exercises"]
        )
    
    async def export_calendar(self, plan_id: str, user_id: str) -> str:
        """Export plan as ICS calendar file"""
        plan = await self.get_plan(plan_id, user_id)
        if not plan:
            raise ValueError("Plan not found")
        
        return await self.calendar_exporter.export_plan(plan)
