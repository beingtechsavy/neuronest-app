'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';

interface BreathingPattern {
  id: string;
  name: string;
  description: string;
  icon: string;
  inhale: number;
  hold1: number;
  exhale: number;
  hold2: number;
  cycles: number;
  benefits: string[];
}

const BREATHING_PATTERNS: BreathingPattern[] = [
  {
    id: '4-7-8',
    name: '4-7-8 Technique',
    description: 'Calming breath for relaxation',
    icon: '😌',
    inhale: 4,
    hold1: 7,
    exhale: 8,
    hold2: 0,
    cycles: 4,
    benefits: ['Reduces anxiety', 'Improves sleep', 'Calms nervous system']
  },
  {
    id: 'box-breathing',
    name: 'Box Breathing',
    description: 'Navy SEAL technique for focus',
    icon: '📦',
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4,
    cycles: 6,
    benefits: ['Enhances focus', 'Reduces stress', 'Improves performance']
  },
  {
    id: 'triangle',
    name: 'Triangle Breathing',
    description: 'Simple 3-step pattern',
    icon: '🔺',
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 0,
    cycles: 8,
    benefits: ['Easy to learn', 'Quick relaxation', 'Mental clarity']
  },
  {
    id: 'coherent',
    name: 'Coherent Breathing',
    description: 'Heart rate variability optimization',
    icon: '💓',
    inhale: 5,
    hold1: 0,
    exhale: 5,
    hold2: 0,
    cycles: 10,
    benefits: ['Heart coherence', 'Emotional balance', 'Sustained focus']
  },
  {
    id: 'energizing',
    name: 'Energizing Breath',
    description: 'Quick energy boost',
    icon: '⚡',
    inhale: 2,
    hold1: 1,
    exhale: 2,
    hold2: 1,
    cycles: 12,
    benefits: ['Increases alertness', 'Boosts energy', 'Mental activation']
  }
];

type BreathingPhase = 'inhale' | 'hold1' | 'exhale' | 'hold2';

interface BreathingExerciseProps {
  onComplete?: () => void;
  autoStart?: boolean;
}

const BreathingExercise: React.FC<BreathingExerciseProps> = ({
  onComplete,
  autoStart = false
}) => {
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern>(BREATHING_PATTERNS[0]);
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<BreathingPhase>('inhale');
  const [phaseTime, setPhaseTime] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  // Auto-start if requested
  useEffect(() => {
    if (autoStart) {
      startExercise();
    }
  }, [autoStart]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const startExercise = () => {
    setIsActive(true);
    setCurrentPhase('inhale');
    setPhaseTime(0);
    setCurrentCycle(0);
    runBreathingCycle();
  };

  const stopExercise = () => {
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  const resetExercise = () => {
    stopExercise();
    setCurrentPhase('inhale');
    setPhaseTime(0);
    setCurrentCycle(0);
  };

  const runBreathingCycle = () => {
    let phase: BreathingPhase = 'inhale';
    let time = 0;
    let cycle = 0;

    const tick = () => {
      time += 0.1;
      setPhaseTime(time);

      const currentPhaseDuration = getPhaseDuration(phase);
      
      if (time >= currentPhaseDuration) {
        time = 0;
        phase = getNextPhase(phase);
        setCurrentPhase(phase);
        
        // Check if we completed a full cycle
        if (phase === 'inhale' && cycle < selectedPattern.cycles - 1) {
          cycle++;
          setCurrentCycle(cycle);
        } else if (phase === 'inhale' && cycle >= selectedPattern.cycles - 1) {
          // Exercise complete
          setIsActive(false);
          onComplete?.();
          return;
        }
      }

      if (isActive) {
        animationRef.current = requestAnimationFrame(tick);
      }
    };

    animationRef.current = requestAnimationFrame(tick);
  };

  const getPhaseDuration = (phase: BreathingPhase): number => {
    switch (phase) {
      case 'inhale': return selectedPattern.inhale;
      case 'hold1': return selectedPattern.hold1;
      case 'exhale': return selectedPattern.exhale;
      case 'hold2': return selectedPattern.hold2;
    }
  };

  const getNextPhase = (phase: BreathingPhase): BreathingPhase => {
    switch (phase) {
      case 'inhale': return selectedPattern.hold1 > 0 ? 'hold1' : 'exhale';
      case 'hold1': return 'exhale';
      case 'exhale': return selectedPattern.hold2 > 0 ? 'hold2' : 'inhale';
      case 'hold2': return 'inhale';
    }
  };

  const getPhaseInstruction = (): string => {
    switch (currentPhase) {
      case 'inhale': return 'Breathe In';
      case 'hold1': return 'Hold';
      case 'exhale': return 'Breathe Out';
      case 'hold2': return 'Hold';
    }
  };

  const getPhaseColor = (): string => {
    switch (currentPhase) {
      case 'inhale': return 'text-blue-400';
      case 'hold1': return 'text-yellow-400';
      case 'exhale': return 'text-green-400';
      case 'hold2': return 'text-purple-400';
    }
  };

  const getCircleScale = (): number => {
    const progress = phaseTime / getPhaseDuration(currentPhase);
    switch (currentPhase) {
      case 'inhale': return 0.5 + (progress * 0.5); // Scale from 0.5 to 1
      case 'exhale': return 1 - (progress * 0.5); // Scale from 1 to 0.5
      default: return currentPhase === 'hold1' ? 1 : 0.5; // Hold at current size
    }
  };

  const progress = ((currentCycle * 4) + (phaseTime / getPhaseDuration(currentPhase))) / (selectedPattern.cycles * 4) * 100;

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          🫁 Breathing Exercise
        </h3>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Pattern Selection */}
      {showSettings && (
        <div className="mb-6 p-4 bg-slate-700/50 rounded-lg">
          <h4 className="text-white font-medium mb-3">Choose a Pattern</h4>
          <div className="grid gap-2">
            {BREATHING_PATTERNS.map((pattern) => (
              <button
                key={pattern.id}
                onClick={() => {
                  setSelectedPattern(pattern);
                  resetExercise();
                }}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedPattern.id === pattern.id
                    ? 'border-blue-500 bg-blue-900/30'
                    : 'border-slate-600 hover:border-slate-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{pattern.icon}</span>
                  <div className="flex-1">
                    <div className="text-white font-medium">{pattern.name}</div>
                    <div className="text-slate-400 text-sm">{pattern.description}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {pattern.inhale}-{pattern.hold1}-{pattern.exhale}-{pattern.hold2} • {pattern.cycles} cycles
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Breathing Visualization */}
      <div className="text-center mb-6">
        <div className="relative w-48 h-48 mx-auto mb-4">
          {/* Breathing Circle */}
          <div 
            className={`absolute inset-0 rounded-full border-4 transition-all duration-1000 ease-in-out ${
              currentPhase === 'inhale' ? 'border-blue-400 bg-blue-400/10' :
              currentPhase === 'hold1' ? 'border-yellow-400 bg-yellow-400/10' :
              currentPhase === 'exhale' ? 'border-green-400 bg-green-400/10' :
              'border-purple-400 bg-purple-400/10'
            }`}
            style={{
              transform: `scale(${getCircleScale()})`,
              filter: `blur(${isActive ? '0px' : '2px'})`
            }}
          />
          
          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-2xl font-bold mb-2 ${getPhaseColor()}`}>
              {getPhaseInstruction()}
            </div>
            <div className="text-slate-400 text-sm">
              {Math.ceil(getPhaseDuration(currentPhase) - phaseTime)}s
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-slate-400 mb-1">
            <span>Cycle {currentCycle + 1} of {selectedPattern.cycles}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Pattern Info */}
        <div className="text-slate-400 text-sm mb-4">
          <span className="text-white font-medium">{selectedPattern.name}</span>
          <br />
          {selectedPattern.description}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <button
          onClick={resetExercise}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          title="Reset"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        
        <button
          onClick={isActive ? stopExercise : startExercise}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            isActive
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          {isActive ? 'Stop' : 'Start'}
        </button>
      </div>

      {/* Benefits */}
      <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg">
        <div className="text-green-300 text-sm">
          <strong>Benefits:</strong> {selectedPattern.benefits.join(' • ')}
        </div>
      </div>
    </div>
  );
};

export default BreathingExercise;