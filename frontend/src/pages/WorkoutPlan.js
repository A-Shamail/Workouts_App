import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Target, 
  Download,
  RefreshCw,
  Info,
  Play
} from 'lucide-react';
import { planService, calendarService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const WorkoutPlan = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadCurrentPlan();
  }, [user]);

  const loadCurrentPlan = async () => {
    try {
      setLoading(true);
      const response = await planService.getCurrent(user.id);
      setCurrentPlan(response.data);
      
      // Set today as default selected day
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const todaysPlan = response.data.days.find(day => day.day === today);
      setSelectedDay(todaysPlan || response.data.days[0]);
      
    } catch (error) {
      console.error('Failed to load plan:', error);
      toast.error('Failed to load workout plan');
    } finally {
      setLoading(false);
    }
  };

  const exportCalendar = async () => {
    try {
      setExporting(true);
      const response = await calendarService.export(currentPlan.plan_id);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `workout_plan_week_${currentPlan.week_number}.ics`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Calendar exported successfully!');
    } catch (error) {
      console.error('Failed to export calendar:', error);
      toast.error('Failed to export calendar');
    } finally {
      setExporting(false);
    }
  };

  const generateNewPlan = async () => {
    try {
      setLoading(true);
      const nextWeek = (currentPlan?.week_number || 0) + 1;
      await planService.generate(nextWeek);
      toast.success('New plan generated!');
      loadCurrentPlan();
    } catch (error) {
      console.error('Failed to generate new plan:', error);
      toast.error('Failed to generate new plan');
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

  if (!currentPlan) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <Calendar className="h-10 w-10 text-gray-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          No workout plan found
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Let's generate your first workout plan to get started.
        </p>
        <button
          onClick={generateNewPlan}
          disabled={loading}
          className="btn-primary btn-lg"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Generating...
            </>
          ) : (
            'Generate Workout Plan'
          )}
        </button>
      </div>
    );
  }

  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const sortedDays = currentPlan.days.sort((a, b) => 
    dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Week {currentPlan.week_number} Workout Plan
          </h1>
          <p className="text-gray-600 mt-1">
            Your personalized 5-day training schedule
          </p>
        </div>
        
        <div className="flex space-x-3 mt-4 md:mt-0">
          <button
            onClick={exportCalendar}
            disabled={exporting}
            className="btn-secondary"
          >
            {exporting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export Calendar
              </>
            )}
          </button>
          
          <button
            onClick={generateNewPlan}
            disabled={loading}
            className="btn-primary"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Generate New Plan
          </button>
        </div>
      </div>

      {/* Adaptation Rationale */}
      {currentPlan.adaptation_rationale && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">Plan Notes</h3>
              <p className="text-blue-800">{currentPlan.adaptation_rationale}</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Day Selector */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Workout Days</h3>
            <div className="space-y-2">
              {sortedDays.map((day, index) => (
                <button
                  key={day.day}
                  onClick={() => setSelectedDay(day)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedDay?.day === day.day
                      ? 'bg-primary-100 border-2 border-primary-500 text-primary-900'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium capitalize">{day.day}</div>
                      <div className="text-sm opacity-75 capitalize">
                        {day.focus.replace('_', ' ')}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 opacity-60" />
                      <span className="text-sm">{day.estimated_duration}m</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Week Stats */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Week Overview</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total workouts:</span>
                  <span className="font-medium">{sortedDays.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total time:</span>
                  <span className="font-medium">
                    {sortedDays.reduce((sum, day) => sum + day.estimated_duration, 0)} min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg. duration:</span>
                  <span className="font-medium">
                    {Math.round(sortedDays.reduce((sum, day) => sum + day.estimated_duration, 0) / sortedDays.length)} min
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Day Details */}
        <div className="lg:col-span-3">
          {selectedDay && (
            <motion.div
              key={selectedDay.day}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="card"
            >
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 capitalize">
                      {selectedDay.day} - {selectedDay.focus.replace('_', ' ')} Focus
                    </h2>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        ~{selectedDay.estimated_duration} minutes
                      </div>
                      <div className="flex items-center">
                        <Target className="h-4 w-4 mr-1" />
                        {selectedDay.exercises.length} exercises
                      </div>
                    </div>
                  </div>
                  
                  <button className="btn-primary">
                    <Play className="mr-2 h-4 w-4" />
                    Start Workout
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {selectedDay.exercises.map((exercise, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-50 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {exercise.exercise_name}
                          </h3>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                          <div className="bg-white rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-gray-900">{exercise.sets}</div>
                            <div className="text-sm text-gray-600">Sets</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-gray-900">{exercise.reps}</div>
                            <div className="text-sm text-gray-600">Reps</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-gray-900">{exercise.rest_seconds}s</div>
                            <div className="text-sm text-gray-600">Rest</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-gray-900">{exercise.target_rpe}/10</div>
                            <div className="text-sm text-gray-600">Target RPE</div>
                          </div>
                        </div>
                        
                        {exercise.notes && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                              <strong>Note:</strong> {exercise.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Workout Summary */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Workout Tips</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Warm up for 5-10 minutes before starting</li>
                    <li>• Focus on proper form over heavy weight</li>
                    <li>• Rest adequately between sets</li>
                    <li>• Stay hydrated throughout your workout</li>
                    <li>• Cool down and stretch after finishing</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkoutPlan;
