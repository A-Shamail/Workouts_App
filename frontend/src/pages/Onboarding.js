import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const STEPS = [
  { id: 'welcome', title: 'Welcome', description: 'Let\'s get you started' },
  { id: 'goals', title: 'Goals', description: 'What do you want to achieve?' },
  { id: 'experience', title: 'Experience', description: 'What\'s your fitness level?' },
  { id: 'equipment', title: 'Equipment', description: 'What equipment do you have?' },
  { id: 'schedule', title: 'Schedule', description: 'When can you work out?' },
  { id: 'constraints', title: 'Health', description: 'Any injuries or limitations?' },
  { id: 'review', title: 'Review', description: 'Let\'s review your profile' },
];

const GOALS = [
  { id: 'strength', label: 'Build Strength', description: 'Increase muscle mass and power' },
  { id: 'endurance', label: 'Improve Endurance', description: 'Better cardiovascular fitness' },
  { id: 'weight_loss', label: 'Lose Weight', description: 'Burn calories and reduce body fat' },
  { id: 'flexibility', label: 'Increase Flexibility', description: 'Improve mobility and range of motion' },
  { id: 'general_fitness', label: 'General Fitness', description: 'Overall health and wellness' },
];

const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Beginner', description: 'New to exercise or returning after a long break' },
  { id: 'intermediate', label: 'Intermediate', description: 'Regular exercise routine for several months' },
  { id: 'advanced', label: 'Advanced', description: 'Experienced with complex movements and high intensity' },
];

const EQUIPMENT_OPTIONS = [
  { id: 'bodyweight', label: 'Bodyweight Only', description: 'No equipment needed' },
  { id: 'dumbbells', label: 'Dumbbells', description: 'Adjustable or fixed weights' },
  { id: 'resistance_bands', label: 'Resistance Bands', description: 'Elastic bands for resistance training' },
  { id: 'kettlebells', label: 'Kettlebells', description: 'Cast iron weights with handles' },
  { id: 'barbell', label: 'Barbell & Plates', description: 'Olympic or standard barbell setup' },
  { id: 'pull_up_bar', label: 'Pull-up Bar', description: 'Doorway or wall-mounted bar' },
  { id: 'bench', label: 'Exercise Bench', description: 'Flat, incline, or adjustable bench' },
  { id: 'cardio_equipment', label: 'Cardio Equipment', description: 'Treadmill, bike, elliptical, etc.' },
];

const PREFERRED_TIMES = [
  { id: 'early_morning', label: 'Early Morning', description: '5:00 - 7:00 AM' },
  { id: 'morning', label: 'Morning', description: '7:00 - 10:00 AM' },
  { id: 'midday', label: 'Midday', description: '10:00 AM - 2:00 PM' },
  { id: 'afternoon', label: 'Afternoon', description: '2:00 - 6:00 PM' },
  { id: 'evening', label: 'Evening', description: '6:00 - 9:00 PM' },
  { id: 'night', label: 'Night', description: '9:00 PM - 12:00 AM' },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    goals: [],
    experienceLevel: '',
    equipment: [],
    schedule: {
      daysPerWeek: 5,
      sessionDuration: 45,
      preferredTimes: []
    },
    constraints: {
      injuries: [],
      limitations: []
    }
  });

  const currentStepData = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleScheduleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [field]: value
      }
    }));
  };

  const handleConstraintsChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      constraints: {
        ...prev.constraints,
        [field]: value
      }
    }));
  };

  const toggleArrayItem = (array, item) => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    } else {
      return [...array, item];
    }
  };

  const handleSubmit = async () => {
    if (!formData.userId.trim()) {
      toast.error('Please enter a user ID');
      return;
    }

    setLoading(true);
    try {
      // Login first
      const loginSuccess = await login(formData.userId);
      if (!loginSuccess) {
        throw new Error('Login failed');
      }

      // Create profile
      const profileData = {
        goals: formData.goals,
        experience_level: formData.experienceLevel,
        equipment: formData.equipment,
        schedule: {
          days_per_week: formData.schedule.daysPerWeek,
          session_duration: formData.schedule.sessionDuration,
          preferred_times: formData.schedule.preferredTimes
        },
        constraints: {
          injuries: formData.constraints.injuries,
          limitations: formData.constraints.limitations
        }
      };

      await profileService.create(profileData);
      
      toast.success('Profile created successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to AI Workout Trainer!
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Let's create your personalized fitness profile. This will help our AI generate 
              the perfect workout plan tailored specifically for you.
            </p>
            <div className="max-w-md mx-auto">
              <label className="label">Enter your user ID</label>
              <input
                type="text"
                value={formData.userId}
                onChange={(e) => handleInputChange('userId', e.target.value)}
                className="input"
                placeholder="e.g., your-name"
                required
              />
              <p className="text-sm text-gray-500 mt-2">
                This will be your unique identifier for the app
              </p>
            </div>
          </div>
        );

      case 'goals':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What are your fitness goals?</h2>
            <p className="text-gray-600 mb-6">Select all that apply:</p>
            <div className="grid md:grid-cols-2 gap-4">
              {GOALS.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => handleInputChange('goals', toggleArrayItem(formData.goals, goal.id))}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    formData.goals.includes(goal.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{goal.label}</h3>
                      <p className="text-sm text-gray-600">{goal.description}</p>
                    </div>
                    {formData.goals.includes(goal.id) && (
                      <Check className="h-5 w-5 text-primary-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'experience':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What's your experience level?</h2>
            <p className="text-gray-600 mb-6">This helps us adjust exercise difficulty:</p>
            <div className="space-y-4">
              {EXPERIENCE_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => handleInputChange('experienceLevel', level.id)}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                    formData.experienceLevel === level.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900">{level.label}</h3>
                      <p className="text-sm text-gray-600">{level.description}</p>
                    </div>
                    {formData.experienceLevel === level.id && (
                      <Check className="h-5 w-5 text-primary-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'equipment':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What equipment do you have?</h2>
            <p className="text-gray-600 mb-6">Select all available equipment:</p>
            <div className="grid md:grid-cols-2 gap-4">
              {EQUIPMENT_OPTIONS.map((equipment) => (
                <button
                  key={equipment.id}
                  onClick={() => handleInputChange('equipment', toggleArrayItem(formData.equipment, equipment.id))}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    formData.equipment.includes(equipment.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{equipment.label}</h3>
                      <p className="text-sm text-gray-600">{equipment.description}</p>
                    </div>
                    {formData.equipment.includes(equipment.id) && (
                      <Check className="h-5 w-5 text-primary-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'schedule':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">When can you work out?</h2>
            <div className="space-y-6">
              <div>
                <label className="label">How many days per week?</label>
                <select
                  value={formData.schedule.daysPerWeek}
                  onChange={(e) => handleScheduleChange('daysPerWeek', parseInt(e.target.value))}
                  className="select"
                >
                  {[3, 4, 5, 6, 7].map(days => (
                    <option key={days} value={days}>{days} days</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Session duration (minutes)</label>
                <select
                  value={formData.schedule.sessionDuration}
                  onChange={(e) => handleScheduleChange('sessionDuration', parseInt(e.target.value))}
                  className="select"
                >
                  {[30, 45, 60, 75, 90].map(duration => (
                    <option key={duration} value={duration}>{duration} minutes</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Preferred workout times</label>
                <div className="grid grid-cols-2 gap-3">
                  {PREFERRED_TIMES.map((time) => (
                    <button
                      key={time.id}
                      onClick={() => handleScheduleChange('preferredTimes', 
                        toggleArrayItem(formData.schedule.preferredTimes, time.id))}
                      className={`p-3 border-2 rounded-lg text-left transition-all ${
                        formData.schedule.preferredTimes.includes(time.id)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-gray-900">{time.label}</h4>
                          <p className="text-xs text-gray-600">{time.description}</p>
                        </div>
                        {formData.schedule.preferredTimes.includes(time.id) && (
                          <Check className="h-4 w-4 text-primary-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'constraints':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Health considerations</h2>
            <p className="text-gray-600 mb-6">
              This helps us create safe workouts tailored to your needs.
            </p>
            <div className="space-y-6">
              <div>
                <label className="label">Current injuries (if any)</label>
                <textarea
                  value={formData.constraints.injuries.join(', ')}
                  onChange={(e) => handleConstraintsChange('injuries', 
                    e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                  className="input"
                  rows="3"
                  placeholder="e.g., lower back, knee, shoulder (leave empty if none)"
                />
              </div>

              <div>
                <label className="label">Physical limitations or conditions</label>
                <textarea
                  value={formData.constraints.limitations.join(', ')}
                  onChange={(e) => handleConstraintsChange('limitations', 
                    e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                  className="input"
                  rows="3"
                  placeholder="e.g., no jumping, limited overhead movement (leave empty if none)"
                />
              </div>
            </div>
          </div>
        );

      case 'review':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Review your profile</h2>
            <p className="text-gray-600 mb-6">
              Please review your information before we create your personalized workout plan.
            </p>
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">User ID</h3>
                <p className="text-gray-600">{formData.userId}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Goals</h3>
                <p className="text-gray-600">
                  {formData.goals.map(goal => 
                    GOALS.find(g => g.id === goal)?.label
                  ).join(', ') || 'None selected'}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Experience Level</h3>
                <p className="text-gray-600">
                  {EXPERIENCE_LEVELS.find(level => level.id === formData.experienceLevel)?.label || 'Not selected'}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Equipment</h3>
                <p className="text-gray-600">
                  {formData.equipment.map(eq => 
                    EQUIPMENT_OPTIONS.find(e => e.id === eq)?.label
                  ).join(', ') || 'None selected'}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Schedule</h3>
                <p className="text-gray-600">
                  {formData.schedule.daysPerWeek} days per week, {formData.schedule.sessionDuration} minutes per session
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return formData.userId.trim() !== '';
      case 'goals':
        return formData.goals.length > 0;
      case 'experience':
        return formData.experienceLevel !== '';
      case 'equipment':
        return formData.equipment.length > 0;
      case 'schedule':
        return formData.schedule.preferredTimes.length > 0;
      case 'constraints':
        return true; // Optional step
      case 'review':
        return true;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Setup Your Profile</h1>
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {STEPS.length}
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg whitespace-nowrap ${
                  index === currentStep
                    ? 'bg-primary-100 text-primary-700'
                    : index < currentStep
                    ? 'bg-success-100 text-success-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  index === currentStep
                    ? 'bg-primary-600 text-white'
                    : index < currentStep
                    ? 'bg-success-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {index < currentStep ? <Check className="h-3 w-3" /> : index + 1}
                </div>
                <span className="text-sm font-medium">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="card min-h-[500px] mb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </button>

          {isLastStep ? (
            <button
              onClick={handleSubmit}
              disabled={loading || !canProceed()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating Profile...
                </>
              ) : (
                'Complete Setup'
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
