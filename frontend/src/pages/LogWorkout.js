import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Play, 
  Clock,
  Target,
  Save
} from 'lucide-react';
import { planService, logService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const LogWorkout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [completedExercises, setCompletedExercises] = useState([]);
  const [generalFeedback, setGeneralFeedback] = useState('');
  const [sessionRPE, setSessionRPE] = useState(5);

  useEffect(() => {
    loadCurrentPlan();
  }, [user]);

  useEffect(() => {
    let interval;
    if (workoutStarted && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [workoutStarted, startTime]);

  const loadCurrentPlan = async () => {
    try {
      setLoading(true);
      const response = await planService.getCurrent(user.id);
      setCurrentPlan(response.data);
      
      // Auto-select today's workout if available
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const todaysPlan = response.data.days.find(day => day.day === today);
      if (todaysPlan) {
        setSelectedDay(todaysPlan);
        initializeCompletedExercises(todaysPlan.exercises);
      }
      
    } catch (error) {
      console.error('Failed to load plan:', error);
      toast.error('Failed to load workout plan');
    } finally {
      setLoading(false);
    }
  };

  const initializeCompletedExercises = (exercises) => {
    const initialized = exercises.map(exercise => ({
      exercise_id: exercise.exercise_id,
      exercise_name: exercise.exercise_name,
      completed_sets: 0,
      actual_reps: [],
      weight_used: 0,
      rpe: exercise.target_rpe,
      notes: ''
    }));
    setCompletedExercises(initialized);
  };

  const startWorkout = () => {
    setWorkoutStarted(true);
    setStartTime(Date.now());
    toast.success('Workout started! Good luck! 💪');
  };

  const updateExercise = (index, field, value) => {
    setCompletedExercises(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addSet = (exerciseIndex) => {
    setCompletedExercises(prev => {
      const updated = [...prev];
      const exercise = updated[exerciseIndex];
      exercise.actual_reps.push(10); // Default reps
      exercise.completed_sets = exercise.actual_reps.length;
      return updated;
    });
  };

  const updateSetReps = (exerciseIndex, setIndex, reps) => {
    setCompletedExercises(prev => {
      const updated = [...prev];
      updated[exerciseIndex].actual_reps[setIndex] = parseInt(reps) || 0;
      return updated;
    });
  };

  const removeSet = (exerciseIndex, setIndex) => {
    setCompletedExercises(prev => {
      const updated = [...prev];
      const exercise = updated[exerciseIndex];
      exercise.actual_reps.splice(setIndex, 1);
      exercise.completed_sets = exercise.actual_reps.length;
      return updated;
    });
  };

  const saveWorkout = async () => {
    if (!selectedDay || completedExercises.length === 0) {
      toast.error('No workout data to save');
      return;
    }

    try {
      setSaving(true);
      
      const logData = {
        plan_id: currentPlan.plan_id,
        day: selectedDay.day,
        exercises: completedExercises.filter(ex => ex.completed_sets > 0),
        session_rpe: sessionRPE,
        duration_minutes: Math.floor(elapsedTime / 60),
        general_feedback: generalFeedback
      };

      await logService.create(logData);
      toast.success('Workout logged successfully! 🎉');
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Failed to save workout:', error);
      toast.error('Failed to save workout');
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          No workout plan available
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          You need to generate a workout plan first.
        </p>
        <button
          onClick={() => navigate('/plan')}
          className="btn-primary"
        >
          Go to Workout Plan
        </button>
      </div>
    );
  }

  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const sortedDays = currentPlan.days.sort((a, b) => 
    dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Log Workout</h1>
          <p className="text-gray-600 mt-1">
            Track your exercises, sets, and RPE
          </p>
        </div>
        
        {workoutStarted && (
          <div className="mt-4 md:mt-0 bg-primary-100 rounded-lg px-4 py-2">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-primary-600" />
              <span className="font-mono text-lg font-semibold text-primary-900">
                {formatTime(elapsedTime)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Day Selector */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Workout</h3>
            <div className="space-y-2">
              {sortedDays.map((day) => (
                <button
                  key={day.day}
                  onClick={() => {
                    setSelectedDay(day);
                    initializeCompletedExercises(day.exercises);
                    setWorkoutStarted(false);
                    setElapsedTime(0);
                  }}
                  disabled={workoutStarted}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedDay?.day === day.day
                      ? 'bg-primary-100 border-2 border-primary-500 text-primary-900'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent text-gray-700'
                  } ${workoutStarted ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="font-medium capitalize">{day.day}</div>
                  <div className="text-sm opacity-75 capitalize">
                    {day.focus.replace('_', ' ')}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Workout Logging */}
        <div className="lg:col-span-3">
          {selectedDay ? (
            <div className="space-y-6">
              {/* Start Workout Button */}
              {!workoutStarted && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card text-center"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 capitalize">
                    {selectedDay.day} - {selectedDay.focus.replace('_', ' ')} Workout
                  </h2>
                  <p className="text-gray-600 mb-6">
                    {selectedDay.exercises.length} exercises • ~{selectedDay.estimated_duration} minutes
                  </p>
                  <button
                    onClick={startWorkout}
                    className="btn-primary btn-lg"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Start Workout
                  </button>
                </motion.div>
              )}

              {/* Exercise Logging */}
              {workoutStarted && (
                <div className="space-y-4">
                  {selectedDay.exercises.map((exercise, exerciseIndex) => (
                    <motion.div
                      key={exerciseIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: exerciseIndex * 0.1 }}
                      className="card"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {exercise.exercise_name}
                          </h3>
                          <p className="text-gray-600">
                            Target: {exercise.sets} sets × {exercise.reps} reps (RPE {exercise.target_rpe})
                          </p>
                        </div>
                        <button
                          onClick={() => addSet(exerciseIndex)}
                          className="btn-sm btn-primary"
                        >
                          Add Set
                        </button>
                      </div>

                      {/* Sets */}
                      <div className="space-y-3 mb-4">
                        {completedExercises[exerciseIndex]?.actual_reps.map((reps, setIndex) => (
                          <div key={setIndex} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-900 w-12">
                              Set {setIndex + 1}
                            </span>
                            
                            <div className="flex items-center space-x-2">
                              <label className="text-sm text-gray-600">Reps:</label>
                              <input
                                type="number"
                                value={reps}
                                onChange={(e) => updateSetReps(exerciseIndex, setIndex, e.target.value)}
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                min="0"
                              />
                            </div>

                            <button
                              onClick={() => removeSet(exerciseIndex, setIndex)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Exercise Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="label">Weight Used (lbs)</label>
                          <input
                            type="number"
                            value={completedExercises[exerciseIndex]?.weight_used || ''}
                            onChange={(e) => updateExercise(exerciseIndex, 'weight_used', parseFloat(e.target.value) || 0)}
                            className="input"
                            placeholder="0"
                          />
                        </div>
                        
                        <div>
                          <label className="label">RPE (1-10)</label>
                          <select
                            value={completedExercises[exerciseIndex]?.rpe || exercise.target_rpe}
                            onChange={(e) => updateExercise(exerciseIndex, 'rpe', parseInt(e.target.value))}
                            className="select"
                          >
                            {[1,2,3,4,5,6,7,8,9,10].map(rpe => (
                              <option key={rpe} value={rpe}>{rpe}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="label">Notes</label>
                          <input
                            type="text"
                            value={completedExercises[exerciseIndex]?.notes || ''}
                            onChange={(e) => updateExercise(exerciseIndex, 'notes', e.target.value)}
                            className="input"
                            placeholder="How did it feel?"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Session Summary */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="card"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Summary</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="label">Overall Session RPE (1-10)</label>
                        <select
                          value={sessionRPE}
                          onChange={(e) => setSessionRPE(parseInt(e.target.value))}
                          className="select"
                        >
                          {[1,2,3,4,5,6,7,8,9,10].map(rpe => (
                            <option key={rpe} value={rpe}>
                              {rpe} - {
                                rpe <= 3 ? 'Very Easy' :
                                rpe <= 5 ? 'Easy' :
                                rpe <= 7 ? 'Moderate' :
                                rpe <= 8 ? 'Hard' :
                                rpe <= 9 ? 'Very Hard' : 'Maximum Effort'
                              }
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="label">Duration</label>
                        <div className="input bg-gray-50 text-gray-600">
                          {formatTime(elapsedTime)}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="label">General Feedback</label>
                      <textarea
                        value={generalFeedback}
                        onChange={(e) => setGeneralFeedback(e.target.value)}
                        className="input"
                        rows="3"
                        placeholder="How did the workout feel overall? Any specific observations..."
                      />
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        onClick={() => {
                          setWorkoutStarted(false);
                          setElapsedTime(0);
                          setStartTime(null);
                        }}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveWorkout}
                        disabled={saving}
                        className="btn-success"
                      >
                        {saving ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Workout
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center py-12">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a workout to begin
              </h3>
              <p className="text-gray-600">
                Choose a day from the sidebar to start logging your workout.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogWorkout;
