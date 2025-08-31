import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Calendar, 
  Target,
  BarChart3,
  Award,
  Clock,
  Zap,
  Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { logService, adaptationService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Progress = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState({
    weeklyStats: [],
    recentWorkouts: [],
    achievements: [],
    trends: {}
  });

  useEffect(() => {
    loadProgressData();
  }, [user]);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      
      // Mock data for demo - in real app, this would come from API
      const mockWeeklyStats = [
        { week: 1, adherence: 60, avgRPE: 6.8, workouts: 3 },
        { week: 2, adherence: 80, avgRPE: 7.2, workouts: 4 },
        { week: 3, adherence: 100, avgRPE: 7.5, workouts: 5 },
        { week: 4, adherence: 80, avgRPE: 7.8, workouts: 4 },
        { week: 5, adherence: 100, avgRPE: 8.0, workouts: 5 },
      ];

      const mockRecentWorkouts = [
        { date: '2024-01-15', day: 'Monday', focus: 'Upper Body', duration: 45, rpe: 8 },
        { date: '2024-01-14', day: 'Sunday', focus: 'Rest', duration: 0, rpe: 0 },
        { date: '2024-01-13', day: 'Saturday', focus: 'Rest', duration: 0, rpe: 0 },
        { date: '2024-01-12', day: 'Friday', focus: 'Full Body', duration: 42, rpe: 7 },
        { date: '2024-01-11', day: 'Thursday', focus: 'Lower Body', duration: 48, rpe: 8 },
      ];

      const mockAchievements = [
        { id: 1, title: 'Consistency King', description: 'Completed 5 weeks in a row', earned: true, date: '2024-01-15' },
        { id: 2, title: 'Perfect Week', description: 'Completed all 5 workouts in a week', earned: true, date: '2024-01-10' },
        { id: 3, title: 'RPE Master', description: 'Maintained target RPE for 10 workouts', earned: false },
        { id: 4, title: 'Early Bird', description: 'Complete 10 morning workouts', earned: true, date: '2024-01-08' },
      ];

      setProgressData({
        weeklyStats: mockWeeklyStats,
        recentWorkouts: mockRecentWorkouts,
        achievements: mockAchievements,
        trends: {
          adherenceChange: '+20%',
          rpeStability: 'Stable',
          progressionRate: 'Good'
        }
      });

    } catch (error) {
      console.error('Failed to load progress data:', error);
      toast.error('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const adaptNextWeek = async () => {
    try {
      const currentWeek = Math.max(...progressData.weeklyStats.map(w => w.week));
      const response = await adaptationService.adapt(user.id, currentWeek);
      toast.success('Next week\'s plan has been adapted based on your progress!');
    } catch (error) {
      console.error('Failed to adapt plan:', error);
      toast.error('Failed to adapt plan');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  const currentWeek = Math.max(...progressData.weeklyStats.map(w => w.week));
  const currentStats = progressData.weeklyStats.find(w => w.week === currentWeek) || {};
  const previousStats = progressData.weeklyStats.find(w => w.week === currentWeek - 1) || {};

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Progress Tracking</h1>
          <p className="text-gray-600 mt-1">
            Your fitness journey at a glance
          </p>
        </div>
        <button
          onClick={adaptNextWeek}
          className="btn-primary mt-4 md:mt-0"
        >
          <Zap className="mr-2 h-4 w-4" />
          Adapt Next Week
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <Target className="h-6 w-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Current Adherence</p>
              <p className="text-2xl font-bold text-gray-900">{currentStats.adherence || 0}%</p>
              <p className="text-xs text-success-600">
                {progressData.trends.adherenceChange} from last week
              </p>
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
              <Activity className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average RPE</p>
              <p className="text-2xl font-bold text-gray-900">{currentStats.avgRPE || 0}/10</p>
              <p className="text-xs text-gray-600">
                {progressData.trends.rpeStability}
              </p>
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
              <Calendar className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">{currentStats.workouts || 0}/5</p>
              <p className="text-xs text-gray-600">Workouts completed</p>
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
              <p className="text-sm font-medium text-gray-600">Progression</p>
              <p className="text-2xl font-bold text-gray-900">{progressData.trends.progressionRate}</p>
              <p className="text-xs text-gray-600">Based on performance</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Adherence Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Weekly Adherence</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData.weeklyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Adherence']} />
                <Line 
                  type="monotone" 
                  dataKey="adherence" 
                  stroke="#0ea5e9" 
                  strokeWidth={3}
                  dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* RPE Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
        >
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Average RPE by Week</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressData.weeklyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis domain={[0, 10]} />
                <Tooltip formatter={(value) => [`${value}/10`, 'RPE']} />
                <Bar dataKey="avgRPE" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity & Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Workouts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card"
        >
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            {progressData.recentWorkouts.slice(0, 5).map((workout, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    workout.duration > 0 
                      ? 'bg-success-100 text-success-600' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {workout.duration > 0 ? (
                      <BarChart3 className="h-5 w-5" />
                    ) : (
                      <Clock className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{workout.day}</div>
                    <div className="text-sm text-gray-600">{workout.focus}</div>
                  </div>
                </div>
                <div className="text-right">
                  {workout.duration > 0 ? (
                    <>
                      <div className="font-medium text-gray-900">{workout.duration}m</div>
                      <div className="text-sm text-gray-600">RPE {workout.rpe}</div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-500">Rest Day</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="card"
        >
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
          </div>
          <div className="space-y-3">
            {progressData.achievements.map((achievement) => (
              <div key={achievement.id} className={`flex items-center p-3 rounded-lg ${
                achievement.earned 
                  ? 'bg-success-50 border border-success-200' 
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                  achievement.earned 
                    ? 'bg-success-100 text-success-600' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <Award className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className={`font-medium ${
                    achievement.earned ? 'text-success-900' : 'text-gray-500'
                  }`}>
                    {achievement.title}
                  </div>
                  <div className={`text-sm ${
                    achievement.earned ? 'text-success-700' : 'text-gray-400'
                  }`}>
                    {achievement.description}
                  </div>
                </div>
                {achievement.earned && (
                  <div className="text-xs text-success-600">
                    {new Date(achievement.date).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Insights & Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="card"
      >
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-primary-50 rounded-lg p-6">
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-primary-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Great Progress This Week!</h4>
              <p className="text-gray-700 mb-3">
                Your adherence has improved by 20% compared to last week. You're consistently 
                hitting your target RPE, which shows excellent effort regulation.
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Recommendation:</strong> Consider increasing weights by 5-10% for your main lifts next week.
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Focus Area:</strong> Your Friday workouts tend to have lower RPE - try starting with compound movements.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Progress;
