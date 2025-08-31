import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  TrendingUp, 
  Target, 
  Clock,
  Play,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Dumbbell
} from 'lucide-react';
import { planService, logService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [stats, setStats] = useState({
    weeklyAdherence: 0,
    totalWorkouts: 0,
    averageRPE: 0,
    currentStreak: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load current plan
      const planResponse = await planService.getCurrent(user.id);
      setCurrentPlan(planResponse.data);
      
      // Load recent logs (mock data for now)
      // const logsResponse = await logService.getWeek(user.id, planResponse.data.week_number);
      // setRecentLogs(logsResponse.data);
      
      // Calculate stats (mock data for now)
      setStats({
        weeklyAdherence: 80,
        totalWorkouts: 24,
        averageRPE: 7.2,
        currentStreak: 5
      });
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      if (error.response?.status === 404) {
        // No current plan - show generate plan option
        setCurrentPlan(null);
      } else {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateInitialPlan = async () => {
    try {
      setLoading(true);
      const response = await planService.generate(1);
      toast.success('Initial workout plan generated!');
      loadDashboardData(); // Reload dashboard
    } catch (error) {
      console.error('Failed to generate plan:', error);
      toast.error('Failed to generate workout plan');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  // If no current plan, show onboarding/generation
  if (!currentPlan) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Dumbbell className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to start your fitness journey?
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Let's generate your first personalized workout plan based on your profile.
          </p>
          <button
            onClick={generateInitialPlan}
            disabled={loading}
            className="btn-primary btn-lg"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Generating Plan...
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" />
                Generate My First Plan
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  const todaysWorkout = currentPlan?.days?.find(day => {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[new Date().getDay()];
    return day.day === todayName;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.id}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's your fitness overview for this week
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link to="/plan" className="btn-primary">
            View Full Plan
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Weekly Adherence</p>
              <p className="text-2xl font-bold text-gray-900">{stats.weeklyAdherence}%</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Workouts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalWorkouts}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center">
            <div className="p-2 bg-warning-100 rounded-lg">
              <Target className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average RPE</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageRPE}/10</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="flex items-center">
            <div className="p-2 bg-danger-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-danger-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Current Streak</p>
              <p className="text-2xl font-bold text-gray-900">{stats.currentStreak} days</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Workout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-bold text-gray-900">Today's Workout</h2>
            </div>
            
            {todaysWorkout ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 capitalize">
                      {todaysWorkout.focus.replace('_', ' ')} Focus
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <Clock className="h-4 w-4 mr-1" />
                      ~{todaysWorkout.estimated_duration} minutes
                    </div>
                  </div>
                  <Link to="/log" className="btn-primary">
                    Start Workout
                  </Link>
                </div>
                
                <div className="space-y-3">
                  {todaysWorkout.exercises.slice(0, 3).map((exercise, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{exercise.exercise_name}</h4>
                        <p className="text-sm text-gray-600">
                          {exercise.sets} sets × {exercise.reps} reps
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        RPE {exercise.target_rpe}
                      </div>
                    </div>
                  ))}
                  {todaysWorkout.exercises.length > 3 && (
                    <div className="text-center py-2">
                      <span className="text-sm text-gray-500">
                        +{todaysWorkout.exercises.length - 3} more exercises
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Rest Day</h3>
                <p className="text-gray-600">
                  No workout scheduled for today. Use this time to recover!
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions & Week Progress */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="card"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/log"
                className="flex items-center p-3 text-left w-full bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
              >
                <Play className="h-5 w-5 text-primary-600 mr-3" />
                <div>
                  <div className="font-medium text-primary-900">Log Workout</div>
                  <div className="text-sm text-primary-600">Record your session</div>
                </div>
              </Link>
              
              <Link
                to="/progress"
                className="flex items-center p-3 text-left w-full bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <TrendingUp className="h-5 w-5 text-gray-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">View Progress</div>
                  <div className="text-sm text-gray-600">See your improvements</div>
                </div>
              </Link>
              
              <Link
                to="/plan"
                className="flex items-center p-3 text-left w-full bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Calendar className="h-5 w-5 text-gray-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Full Plan</div>
                  <div className="text-sm text-gray-600">View weekly schedule</div>
                </div>
              </Link>
            </div>
          </motion.div>

          {/* Week Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="card"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Week Progress</h3>
            <div className="space-y-3">
              {currentPlan?.days?.map((day, index) => {
                const isCompleted = Math.random() > 0.4; // Mock completion status
                const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const todayName = dayNames[new Date().getDay()];
                const isToday = day.day === todayName;
                
                return (
                  <div key={day.day} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        isCompleted 
                          ? 'bg-success-100 text-success-600' 
                          : isToday
                          ? 'bg-primary-100 text-primary-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <span className="text-xs font-medium">{index + 1}</span>
                        )}
                      </div>
                      <div>
                        <div className={`font-medium capitalize ${
                          isToday ? 'text-primary-900' : 'text-gray-900'
                        }`}>
                          {day.day}
                        </div>
                        <div className="text-sm text-gray-600 capitalize">
                          {day.focus.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                    {isToday && (
                      <span className="badge-primary">Today</span>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="card"
      >
        <div className="card-header">
          <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
        </div>
        
        {recentLogs.length > 0 ? (
          <div className="space-y-4">
            {recentLogs.map((log, index) => (
              <div key={log.log_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 capitalize">
                    {log.day} Workout
                  </h4>
                  <p className="text-sm text-gray-600">
                    {log.duration_minutes} min • RPE {log.session_rpe}/10
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(log.completed_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <BarChart3 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No workouts yet</h3>
            <p className="text-gray-600 mb-4">
              Complete your first workout to see your activity here.
            </p>
            <Link to="/log" className="btn-primary">
              Log Your First Workout
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Dashboard;
