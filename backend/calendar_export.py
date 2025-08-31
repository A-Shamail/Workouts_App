"""
Calendar export functionality for workout plans
"""
import os
from datetime import datetime, timedelta
from icalendar import Calendar, Event
from models import WorkoutPlan, WorkoutDay

class CalendarExporter:
    """Export workout plans to ICS calendar format"""
    
    def __init__(self):
        self.calendar_dir = "exports"
        os.makedirs(self.calendar_dir, exist_ok=True)
    
    async def export_plan(self, plan: WorkoutPlan) -> str:
        """Export workout plan to ICS file"""
        cal = Calendar()
        cal.add('prodid', '-//LLM Workout Trainer//Workout Plan//EN')
        cal.add('version', '2.0')
        cal.add('calscale', 'GREGORIAN')
        cal.add('method', 'PUBLISH')
        
        # Calculate start date (next Monday)
        today = datetime.now().date()
        days_until_monday = (7 - today.weekday()) % 7
        if days_until_monday == 0:  # If today is Monday
            days_until_monday = 7
        start_date = today + timedelta(days=days_until_monday)
        
        # Map day names to weekday numbers
        day_mapping = {
            'monday': 0,
            'tuesday': 1,
            'wednesday': 2,
            'thursday': 3,
            'friday': 4
        }
        
        for workout_day in plan.days:
            event = Event()
            
            # Calculate event date
            day_offset = day_mapping.get(workout_day.day.lower(), 0)
            event_date = start_date + timedelta(days=day_offset)
            
            # Set event time (default to 9 AM, 1-hour duration)
            start_time = datetime.combine(event_date, datetime.min.time().replace(hour=9))
            end_time = start_time + timedelta(minutes=workout_day.estimated_duration)
            
            event.add('uid', f'{plan.plan_id}_{workout_day.day}@workouttrainer.local')
            event.add('dtstart', start_time)
            event.add('dtend', end_time)
            event.add('summary', f'{workout_day.focus.title()} Workout')
            
            # Build description
            description_lines = [
                f"Week {plan.week_number} - {workout_day.focus.title()} Focus",
                f"Estimated Duration: {workout_day.estimated_duration} minutes",
                "",
                "Exercises:"
            ]
            
            for exercise in workout_day.exercises:
                exercise_line = f"• {exercise.exercise_name}: {exercise.sets} sets of {exercise.reps}"
                if exercise.notes:
                    exercise_line += f" ({exercise.notes})"
                description_lines.append(exercise_line)
            
            if plan.adaptation_rationale:
                description_lines.extend(["", f"Notes: {plan.adaptation_rationale}"])
            
            event.add('description', '\n'.join(description_lines))
            event.add('location', 'Home Gym')
            event.add('categories', ['Fitness', 'Workout'])
            
            # Add alarm 15 minutes before
            from icalendar import Alarm
            alarm = Alarm()
            alarm.add('action', 'DISPLAY')
            alarm.add('description', 'Workout reminder')
            alarm.add('trigger', timedelta(minutes=-15))
            event.add_component(alarm)
            
            cal.add_component(event)
        
        # Save to file
        filename = f"workout_plan_{plan.plan_id}.ics"
        filepath = os.path.join(self.calendar_dir, filename)
        
        with open(filepath, 'wb') as f:
            f.write(cal.to_ical())
        
        return filepath
