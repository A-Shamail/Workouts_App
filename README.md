# LLM Workout Trainer

A locally-runnable proof of concept that uses LangGraph + Gemini 1.5 Flash to create personalized workout plans and adapt them based on user feedback.

## Features

- 🏋️ Personalized workout plan generation based on user profile
- 📊 Workout logging with RPE (Rate of Perceived Exertion) tracking
- 🔄 AI-powered plan adaptation based on performance and feedback
- 📅 Calendar export (ICS format) for workout scheduling
- 💡 Natural language feedback processing
- 📱 Modern, responsive web interface

## Quick Start

### Option 1: Automated Setup (Recommended)
```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the startup script (starts both backend and frontend)
python start.py
```

### Option 2: Manual Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment variables:**
   ```bash
   # Copy the example env file
   cp env.example backend/.env
   # Edit backend/.env and add your Google API key for Gemini
   ```

3. **Get your Gemini API key:**
   - Go to [Google AI Studio](https://aistudio.google.com/)
   - Create an API key for Gemini
   - Add it to `backend/.env`: `GOOGLE_API_KEY=your_actual_api_key_here`

4. **Run the backend:**
   ```bash
   python run_backend.py
   # OR manually:
   cd backend && python main.py
   ```

5. **Set up and run the frontend (in a new terminal):**
   ```bash
   cd frontend
   npm install
   npm start
   ```

6. **Access the application:**
   - 🎨 Frontend: http://localhost:3000
   - 🚀 Backend API: http://localhost:8000
   - 📖 API Documentation: http://localhost:8000/docs

## First Time Usage

1. **Open the app:** Navigate to http://localhost:3000
2. **Complete onboarding:** Set up your fitness profile (goals, experience, equipment, etc.)
3. **Generate your first plan:** The AI will create a personalized 5-day workout plan
4. **Start working out:** Use the workout logging feature to track your sessions
5. **Get adaptations:** Each week, the AI adapts your plan based on your performance and feedback

## Architecture

- **Backend**: FastAPI with SQLite database
- **Frontend**: React with modern UI components
- **AI Engine**: LangGraph orchestrating Gemini 1.5 Flash
- **Storage**: SQLite for persistence, ICS files for calendar export

## Key Features Walkthrough

### 🎯 Smart Onboarding
- **Personalized Assessment**: Set up your fitness goals, experience level, available equipment, and schedule
- **Health Considerations**: Input any injuries or limitations for safe workout planning
- **Preference Learning**: The AI learns your workout preferences and constraints

### 🤖 AI-Powered Plan Generation
- **Gemini 1.5 Flash Integration**: Uses Google's latest LLM for intelligent workout planning
- **LangGraph Workflow**: Sophisticated state management for plan generation and adaptation
- **Equipment-Aware**: Plans automatically adjust based on your available equipment
- **Progressive Overload**: Intelligent progression that adapts to your fitness level

### 📊 Workout Logging & Tracking
- **RPE-Based Training**: Rate of Perceived Exertion tracking for optimal intensity management
- **Detailed Exercise Logging**: Track sets, reps, weights, and personal notes
- **Real-Time Timer**: Built-in workout timer with session duration tracking
- **Feedback Processing**: Natural language feedback analysis for plan improvements

### 📈 Progress Analytics
- **Performance Trends**: Visualize your adherence, RPE patterns, and progression over time
- **Achievement System**: Unlock achievements for consistency and milestones
- **AI Insights**: Get personalized recommendations based on your performance data
- **Adaptation Rationale**: Understand why your plan changes each week

### 📅 Calendar Integration
- **ICS Export**: Export your workout plan to any calendar app (Google Calendar, Apple Calendar, Outlook)
- **Smart Scheduling**: Workouts scheduled based on your preferred times
- **Automatic Reminders**: Set up notifications in your calendar app

### 🔄 Intelligent Adaptation
- **Weekly Plan Evolution**: Plans automatically adapt based on your performance and feedback
- **Injury Prevention**: Smart exercise substitution when pain or discomfort is detected
- **Deload Management**: Automatic deload weeks when fatigue indicators are high
- **Progressive Challenges**: Gradual difficulty increases as you get stronger

## Development

The project follows a modular architecture with clear separation between:
- Data models and database operations
- LangGraph workflow orchestration
- API endpoints and business logic
- Frontend components and state management
