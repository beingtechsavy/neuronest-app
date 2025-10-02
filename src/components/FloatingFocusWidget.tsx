'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusSession } from '@/contexts/FocusSessionContext';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Minimize2, 
  Maximize2, 
  X, 
  BookOpen, 
  Coffee,
  Brain
} from 'lucide-react';

// Widget display states
type WidgetState = 'minimized' | 'compact' | 'expanded';

// Position interface
interface Position {
  x: number;
  y: number;
}

// UI element dimensions and positions for collision detection
const UI_ELEMENTS = {
  sidebar: { x: 0, y: 0, width: 240, height: '100vh' }, // lg:ml-60 = 240px
  sidebarCollapsed: { x: 0, y: 0, width: 72, height: '100vh' },
  topbar: { x: 240, y: 0, width: 'calc(100vw - 240px)', height: 64 }, // Estimated topbar height
  toast: { x: 20, y: 20, width: 400, height: 100 }, // Toast notification area
};

// Smart positioning that avoids UI conflicts
const getSmartPosition = (widgetWidth: number, widgetHeight: number): Position => {
  if (typeof window === 'undefined') return { x: 20, y: 20 };
  
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const padding = 20;
  
  // Determine sidebar width based on screen size
  const sidebarWidth = screenWidth >= 1024 ? 240 : 0; // lg breakpoint
  
  // Calculate safe zones
  const safeZones = [
    // Bottom-right (preferred)
    {
      x: screenWidth - widgetWidth - padding,
      y: screenHeight - widgetHeight - padding,
      priority: 1
    },
    // Top-right
    {
      x: screenWidth - widgetWidth - padding,
      y: UI_ELEMENTS.topbar.height + padding,
      priority: 2
    },
    // Bottom-left (avoiding sidebar)
    {
      x: sidebarWidth + padding,
      y: screenHeight - widgetHeight - padding,
      priority: 3
    },
    // Center-right
    {
      x: screenWidth - widgetWidth - padding,
      y: (screenHeight - widgetHeight) / 2,
      priority: 4
    }
  ];
  
  // Return the highest priority position that fits
  for (const zone of safeZones.sort((a, b) => a.priority - b.priority)) {
    if (zone.x >= sidebarWidth && 
        zone.x + widgetWidth <= screenWidth &&
        zone.y >= 0 && 
        zone.y + widgetHeight <= screenHeight) {
      return { x: zone.x, y: zone.y };
    }
  }
  
  // Fallback to simple bottom-right
  return {
    x: Math.max(sidebarWidth + padding, screenWidth - widgetWidth - padding),
    y: Math.max(padding, screenHeight - widgetHeight - padding)
  };
};

// Default positions for different screen sizes
const getDefaultPosition = (): Position => {
  if (typeof window === 'undefined') return { x: 20, y: 20 };
  
  // Use smart positioning by default
  return getSmartPosition(320, 200); // Estimated widget dimensions
};

export function FloatingFocusWidget() {
  const {
    state,
    startSession,
    pauseSession,
    resumeSession,
    skipSession,
    resetSession,
    formatTime,
    getProgress,
    getStateConfig
  } = useFocusSession();

  // Widget state management
  const [widgetState, setWidgetState] = useState<WidgetState>('compact');
  const [position, setPosition] = useState<Position>({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  
  // Refs
  const widgetRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<Position>({ x: 0, y: 0 });

  // Load saved position and state on mount
  useEffect(() => {
    const savedPosition = localStorage.getItem('floatingWidgetPosition');
    const savedState = localStorage.getItem('floatingWidgetState');
    
    if (savedPosition) {
      try {
        const parsedPosition = JSON.parse(savedPosition);
        setPosition(parsedPosition);
      } catch (error) {
        console.error('Failed to parse saved position:', error);
        setPosition(getDefaultPosition());
      }
    } else {
      setPosition(getDefaultPosition());
    }
    
    if (savedState && ['minimized', 'compact', 'expanded'].includes(savedState)) {
      setWidgetState(savedState as WidgetState);
    }
  }, []);

  // Save position and state to localStorage
  useEffect(() => {
    localStorage.setItem('floatingWidgetPosition', JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    localStorage.setItem('floatingWidgetState', widgetState);
  }, [widgetState]);

  // Collision detection and smart repositioning
  const checkCollisions = useCallback((pos: Position): Position => {
    if (!widgetRef.current) return pos;
    
    const widgetRect = {
      x: pos.x,
      y: pos.y,
      width: widgetRef.current.offsetWidth,
      height: widgetRef.current.offsetHeight
    };
    
    const screenWidth = window.innerWidth;
    const sidebarWidth = screenWidth >= 1024 ? 240 : 0;
    
    // Check collision with sidebar
    if (widgetRect.x < sidebarWidth + 10) {
      pos.x = sidebarWidth + 20;
    }
    
    // Check collision with topbar
    if (widgetRect.y < UI_ELEMENTS.topbar.height + 10) {
      pos.y = UI_ELEMENTS.topbar.height + 20;
    }
    
    // Keep within screen bounds
    const maxX = screenWidth - widgetRect.width - 20;
    const maxY = window.innerHeight - widgetRect.height - 20;
    
    return {
      x: Math.max(sidebarWidth + 20, Math.min(pos.x, maxX)),
      y: Math.max(UI_ELEMENTS.topbar.height + 20, Math.min(pos.y, maxY))
    };
  }, []);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).closest('.drag-handle')) {
      return; // Only allow dragging from the drag handle area
    }
    
    e.preventDefault();
    setIsDragging(true);
    
    const rect = widgetRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
    
    dragStartPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    e.preventDefault();
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Apply collision detection and smart constraints
    const constrainedPos = checkCollisions({ x: newX, y: newY });
    setPosition(constrainedPos);
  }, [isDragging, dragOffset, checkCollisions]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle window resize and smart repositioning
  useEffect(() => {
    const handleResize = () => {
      if (!widgetRef.current) return;
      
      const currentWidth = widgetRef.current.offsetWidth;
      const currentHeight = widgetRef.current.offsetHeight;
      
      // Use smart positioning on resize
      const smartPos = getSmartPosition(currentWidth, currentHeight);
      const safePos = checkCollisions(smartPos);
      
      setPosition(safePos);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkCollisions]);

  // Auto-adjust position when widget state changes (size changes)
  useEffect(() => {
    if (!widgetRef.current) return;
    
    const currentWidth = widgetRef.current.offsetWidth;
    const currentHeight = widgetRef.current.offsetHeight;
    
    // Check if current position causes conflicts after state change
    const adjustedPos = checkCollisions(position);
    
    if (adjustedPos.x !== position.x || adjustedPos.y !== position.y) {
      setPosition(adjustedPos);
    }
  }, [widgetState, checkCollisions, position]);

  // Don't render if session is not active
  if (!state.isActive) {
    return null;
  }

  const stateConfig = getStateConfig();
  const progress = getProgress();

  // Toggle session play/pause
  const handleToggleSession = () => {
    if (state.isRunning) {
      pauseSession();
    } else {
      resumeSession();
    }
  };

  // Widget state transitions
  const toggleMinimized = () => {
    setWidgetState(prev => prev === 'minimized' ? 'compact' : 'minimized');
  };

  const toggleExpanded = () => {
    setWidgetState(prev => prev === 'expanded' ? 'compact' : 'expanded');
  };

  // Reset to default position
  const resetPosition = () => {
    const defaultPos = getDefaultPosition();
    setPosition(defaultPos);
    localStorage.removeItem('floatingWidgetPosition'); // Clear saved position
  };

  // Get appropriate icon for session state
  const getStateIcon = () => {
    switch (state.currentState) {
      case 'work':
        return BookOpen;
      case 'shortBreak':
      case 'longBreak':
        return Coffee;
      default:
        return Brain;
    }
  };

  const StateIcon = getStateIcon();

  // Render minimized state
  if (widgetState === 'minimized') {
    return (
      <div
        ref={widgetRef}
        className={`fixed z-50 cursor-move select-none transition-all duration-300 ${
          isDragging ? 'scale-105 shadow-2xl' : 'hover:scale-105'
        }`}
        style={{ left: position.x, top: position.y }}
        onMouseDown={handleMouseDown}
        onClick={toggleMinimized}
      >
        <div className={`
          w-16 h-16 rounded-full flex items-center justify-center
          bg-gradient-to-br ${stateConfig.bgGradient}
          border-2 ${stateConfig.borderColor}
          shadow-lg backdrop-blur-sm
          hover:shadow-xl transition-all duration-200
        `}>
          <div className="relative">
            <StateIcon className="w-6 h-6 text-white" />
            {/* Progress ring */}
            <svg className="absolute -inset-2 w-10 h-10 transform -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="18"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="2"
                fill="none"
              />
              <circle
                cx="20"
                cy="20"
                r="18"
                stroke="white"
                strokeWidth="2"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 18}`}
                strokeDashoffset={`${2 * Math.PI * 18 * (1 - progress / 100)}`}
                className="transition-all duration-1000"
              />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  // Render compact state
  if (widgetState === 'compact') {
    return (
      <div
        ref={widgetRef}
        className={`fixed z-50 select-none transition-all duration-300 ${
          isDragging ? 'scale-105 shadow-2xl' : ''
        }`}
        style={{ left: position.x, top: position.y }}
      >
        <div className={`
          bg-gray-900/95 backdrop-blur-md border border-gray-700
          rounded-xl shadow-xl p-3 min-w-[260px] max-w-[300px]
          ${stateConfig.lightBg} ${stateConfig.borderColor}
          sm:p-4 sm:min-w-[280px] sm:max-w-[320px]
        `}>
          {/* Header with drag handle */}
          <div 
            className="drag-handle flex items-center justify-between mb-3 cursor-move"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-2">
              <StateIcon className={`w-4 h-4 ${stateConfig.textColor}`} />
              <span className={`text-sm font-medium ${stateConfig.textColor}`}>
                {stateConfig.label}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleExpanded}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
                title="Expand"
              >
                <Maximize2 className="w-3 h-3 text-gray-400" />
              </button>
              <button
                onClick={toggleMinimized}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
                title="Minimize"
              >
                <Minimize2 className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Timer display with session type */}
          <div className="text-center mb-4">
            <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">
              {stateConfig.label}
            </div>
            <div className={`text-2xl font-mono font-bold ${stateConfig.textColor}`}>
              {formatTime(state.timeLeft)}
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2 relative overflow-hidden">
              <div 
                className={`h-2 rounded-full bg-gradient-to-r ${stateConfig.bgGradient} transition-all duration-1000`}
                style={{ width: `${progress}%` }}
              />
              {/* Pulse animation when running */}
              {state.isRunning && (
                <div 
                  className={`absolute inset-0 h-2 rounded-full bg-gradient-to-r ${stateConfig.bgGradient} opacity-30 animate-pulse`}
                />
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {Math.round(progress)}% • {state.isRunning ? 'Running' : 'Paused'}
            </div>
          </div>

          {/* Controls - Simplified */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleToggleSession}
              className={`
                p-2 rounded-lg bg-gradient-to-r ${stateConfig.bgGradient}
                hover:opacity-90 transition-opacity
                text-white shadow-md
              `}
              title={state.isRunning ? 'Pause' : 'Resume'}
            >
              {state.isRunning ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
            
            {/* Skip button for compact mode */}
            {state.currentState !== 'idle' && (
              <button
                onClick={skipSession}
                className="p-2 rounded-lg bg-orange-600 hover:bg-orange-700 transition-colors text-white"
                title={state.currentState === 'work' ? 'Skip to break' : 'Skip break'}
              >
                ⏭️
              </button>
            )}
            
            <button
              onClick={resetSession}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-gray-300"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Session stats and progress */}
          <div className="mt-3 space-y-2">
            <div className="flex justify-between items-center text-xs text-gray-400">
              <span>Sessions: {state.completedSessions}</span>
              <span>
                {state.completedSessions % state.settings.sessionsUntilLongBreak === 0 && state.completedSessions > 0
                  ? 'Long break next'
                  : `${state.settings.sessionsUntilLongBreak - (state.completedSessions % state.settings.sessionsUntilLongBreak)} until long break`
                }
              </span>
            </div>
            
            {/* Mini session progress indicator */}
            <div className="flex items-center gap-1">
              {Array.from({ length: state.settings.sessionsUntilLongBreak }).map((_, index) => (
                <div
                  key={index}
                  className={`
                    flex-1 h-1 rounded-full transition-colors
                    ${index < (state.completedSessions % state.settings.sessionsUntilLongBreak)
                      ? `bg-gradient-to-r ${stateConfig.bgGradient}`
                      : 'bg-gray-600'
                    }
                  `}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render expanded state
  return (
    <div
      ref={widgetRef}
      className={`fixed z-50 select-none transition-all duration-300 ${
        isDragging ? 'scale-105 shadow-2xl' : ''
      }`}
      style={{ left: position.x, top: position.y }}
    >
      <div className={`
        bg-gray-900/95 backdrop-blur-md border border-gray-700
        rounded-xl shadow-xl p-4 min-w-[300px] max-w-[360px]
        ${stateConfig.lightBg} ${stateConfig.borderColor}
        sm:min-w-[320px] sm:max-w-[380px]
      `}>
        {/* Header with drag handle */}
        <div 
          className="drag-handle flex items-center justify-between mb-4 cursor-move"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <StateIcon className={`w-5 h-5 ${stateConfig.textColor}`} />
            <span className={`font-medium ${stateConfig.textColor}`}>
              {stateConfig.label}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={resetPosition}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Reset Position"
            >
              <RotateCcw className="w-3 h-3 text-gray-400" />
            </button>
            <button
              onClick={toggleExpanded}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Collapse"
            >
              <Minimize2 className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={toggleMinimized}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Minimize"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Timer display */}
        <div className="text-center mb-6">
          <div className={`text-3xl font-mono font-bold ${stateConfig.textColor} mb-2`}>
            {formatTime(state.timeLeft)}
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className={`h-3 rounded-full bg-gradient-to-r ${stateConfig.bgGradient} transition-all duration-1000`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-sm text-gray-400 mt-1">
            {Math.round(progress)}% complete
          </div>
        </div>

        {/* Main controls */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            onClick={handleToggleSession}
            className={`
              px-4 py-2 rounded-lg bg-gradient-to-r ${stateConfig.bgGradient}
              hover:opacity-90 transition-opacity
              text-white shadow-md font-medium
              flex items-center gap-2
            `}
          >
            {state.isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Resume
              </>
            )}
          </button>
          
          {/* Skip button for expanded mode */}
          {state.currentState !== 'idle' && (
            <button
              onClick={skipSession}
              className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 transition-colors text-white font-medium flex items-center gap-2"
            >
              ⏭️ Skip {state.currentState === 'work' ? 'to Break' : 'Break'}
            </button>
          )}
          
          <button
            onClick={resetSession}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-gray-300 font-medium flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>



        {/* Session statistics and quick actions */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className={`text-lg font-bold ${stateConfig.textColor}`}>
                {state.completedSessions}
              </div>
              <div className="text-gray-400">Sessions</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold ${stateConfig.textColor}`}>
                {state.settings.sessionsUntilLongBreak - (state.completedSessions % state.settings.sessionsUntilLongBreak)}
              </div>
              <div className="text-gray-400">Until Long Break</div>
            </div>
          </div>

          {/* Quick session actions */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                resetSession();
                startSession();
              }}
              className="flex-1 px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-gray-300"
              disabled={state.isRunning}
            >
              Quick Start
            </button>
            <button
              onClick={() => window.location.href = '/focus-session'}
              className="flex-1 px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-gray-300"
            >
              Full View
            </button>
          </div>

          {/* Session progress indicator */}
          <div className="flex items-center gap-1">
            {Array.from({ length: state.settings.sessionsUntilLongBreak }).map((_, index) => (
              <div
                key={index}
                className={`
                  flex-1 h-1 rounded-full transition-colors
                  ${index < (state.completedSessions % state.settings.sessionsUntilLongBreak)
                    ? `bg-gradient-to-r ${stateConfig.bgGradient}`
                    : 'bg-gray-700'
                  }
                `}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}