# Implementation Plan

- [x] 1. Create core infrastructure and audio system foundation




  - Set up the FocusSessionProvider context with basic state management
  - Implement real audio file loading and playbook system
  - Create enhanced sound options with actual file paths
  - _Requirements: 1.1, 3.1, 3.2, 8.1_

- [x] 1.1 Create FocusSessionProvider with global state management


  - Create src/contexts/FocusSessionContext.tsx with comprehensive state interface
  - Extract existing session logic from focus-session/page.tsx into the provider
  - Implement session lifecycle methods (start, pause, resume, reset, complete)
  - Add state persistence to localStorage with automatic recovery on app load
  - Create custom hook useFocusSession for consuming the context
  - _Requirements: 1.1, 1.4, 1.5_

- [x] 1.2 Implement AudioManager class for real audio file handling


  - Create src/lib/AudioManager.ts class with preloading capabilities
  - Replace Web Audio API generation in AmbientSoundPlayer with HTML5 audio elements
  - Implement audio file loading from public/sounds directory (rain.mp3, forest.mp3, etc.)
  - Add volume control, muting, and seamless looping functionality
  - Create audio context management with browser compatibility fallbacks
  - _Requirements: 3.1, 3.2, 3.4, 8.1, 8.3_

- [x] 1.3 Update sound options to use real audio files


  - Modify SoundOption interface in AmbientSoundPlayer to include filePath property
  - Update SOUND_OPTIONS array with actual file paths from public/sounds directory
  - Remove frequency property and Web Audio API generation for nature/ambient sounds
  - Create fallback system for when audio files fail to load (show error message)
  - Keep generated sounds only for white noise and binaural beats
  - _Requirements: 3.1, 3.5_

- [x] 2. Enhance AmbientSoundPlayer with real audio integration




  - Replace generated sounds with real audio file playback
  - Implement seamless looping for ambient sounds
  - Add smooth crossfading between different sounds
  - Create loading states and error handling UI
  - _Requirements: 3.1, 3.2, 3.4_

- [x] 2.1 Refactor AmbientSoundPlayer to use AudioManager



  - Update AmbientSoundPlayer component to consume FocusSessionContext instead of local state
  - Replace existing generateSound and playAmbientSound methods with AudioManager integration
  - Remove audioContextRef, oscillatorRef, and related Web Audio API code for file-based sounds
  - Implement proper audio element lifecycle management with cleanup
  - Add loading indicators and error states for audio files that fail to load
  - _Requirements: 3.1, 3.2, 3.5_

- [x] 2.2 Implement audio mixing capabilities


  - Add support for playing multiple sounds simultaneously
  - Create individual volume controls for each active sound
  - Implement master volume control affecting all sounds
  - Add visual feedback for active sounds and mixing levels
  - _Requirements: 4.1, 4.2_

- [x] 2.3 Create sound preset system


  - Implement preset saving and loading functionality
  - Create UI for managing sound presets (save, load, delete)
  - Add preset suggestions based on usage patterns
  - Store presets in localStorage with sync across sessions
  - _Requirements: 4.3_

- [x] 3. Create FloatingFocusWidget for persistent controls




  - Build draggable floating widget component
  - Implement multiple widget states (minimized, compact, expanded)
  - Add positioning persistence and smart collision avoidance
  - Create responsive design for different screen sizes
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3.1 Build base FloatingFocusWidget component


  - Create draggable widget with react-draggable or custom implementation
  - Implement three display states: minimized, compact, and expanded
  - Add smooth transitions between widget states
  - Create positioning system that remembers user preferences
  - Write component tests for drag functionality and state transitions
  - _Requirements: 2.1, 2.2, 2.4_


- [x] 3.2 Add comprehensive focus session controls to widget

  - Implement play/pause/reset controls in compact mode
  - Add timer display with progress visualization
  - Create quick access buttons for common actions
  - Add session type indicator and statistics display
  - _Requirements: 2.2, 2.3_


- [x] 3.3 Implement widget positioning and persistence

  - Add smart positioning that avoids UI conflicts
  - Implement position persistence using localStorage
  - Create collision detection with app UI elements
  - Add reset-to-default positioning option
  - _Requirements: 2.4, 2.5_

- [ ] 4. Integrate FocusSessionProvider and FloatingFocusWidget globally
  - Add FocusSessionProvider to root layout for global state availability
  - Add FloatingFocusWidget to root layout for universal access
  - Implement conditional rendering based on session state
  - Create smooth show/hide animations
  - _Requirements: 1.1, 2.1_

- [ ] 4.0 Add FocusSessionProvider to RootLayoutInner
  - Import FocusSessionProvider in src/app/RootLayoutInner.tsx
  - Wrap the existing providers with FocusSessionProvider (after SupabaseProvider, before ToastProvider)
  - Ensure the provider is available to all app pages
  - Test that context is accessible from focus session page and dashboard widget
  - _Requirements: 1.1_

- [ ] 4.1 Add FloatingFocusWidget to RootLayoutInner
  - Import and render FloatingFocusWidget in src/app/RootLayoutInner.tsx after ToastProvider
  - Implement conditional rendering based on active session state from FocusSessionContext
  - Add proper z-index management (z-50 or higher) to avoid conflicts with sidebar and modals
  - Create smooth entrance and exit animations using CSS transitions
  - Only show widget on app pages (when isAppPage is true)
  - _Requirements: 1.1, 2.1_

- [ ] 4.2 Implement keyboard shortcuts and accessibility
  - Add keyboard shortcuts for common widget actions (space for play/pause, etc.)
  - Implement proper ARIA labels and keyboard navigation
  - Add focus management for widget interactions
  - Create screen reader announcements for session state changes
  - _Requirements: 2.3_

- [ ] 5. Implement cross-tab synchronization system
  - Create CrossTabSynchronizer using Broadcast Channel API
  - Implement leader election for managing active sessions
  - Add real-time state synchronization between tabs
  - Handle tab conflicts and session handover scenarios
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 5.1 Create CrossTabSynchronizer class
  - Implement Broadcast Channel API for inter-tab communication
  - Create leader election algorithm to designate primary tab
  - Add message broadcasting for state changes
  - Implement conflict resolution for simultaneous actions
  - Write unit tests for synchronization logic
  - _Requirements: 5.1, 5.2, 5.5_

- [ ] 5.2 Integrate cross-tab sync with FocusSessionProvider
  - Connect CrossTabSynchronizer to the global state management
  - Implement automatic state broadcasting on changes
  - Add incoming message handling and state updates
  - Create tab handover logic when primary tab closes
  - _Requirements: 5.3, 5.4_

- [ ] 6. Enhance focus session page with new capabilities
  - Update existing focus session page to use global context
  - Add advanced audio mixing interface
  - Implement preset management UI
  - Create enhanced session statistics and insights
  - _Requirements: 4.1, 4.2, 4.3, 6.3_

- [ ] 6.1 Refactor focus session page to use FocusSessionProvider
  - Update src/app/focus-session/page.tsx to consume FocusSessionContext instead of local state
  - Remove all useState hooks for session state (settings, currentState, timeLeft, isRunning, etc.)
  - Replace local methods (toggleTimer, resetTimer, handleSessionComplete) with context methods
  - Keep UI-specific state (showSettings, showBreathingModal, focusMode) as local state
  - Ensure all existing functionality works with new architecture
  - _Requirements: 1.1_

- [ ] 6.2 Create advanced audio mixing interface
  - Build AudioMixer component for combining multiple sounds
  - Add visual mixing board with individual sound controls
  - Implement drag-and-drop for sound selection
  - Create real-time audio visualization (waveform or equalizer)
  - _Requirements: 4.1, 4.2, 4.5_

- [ ] 6.3 Add preset management and smart suggestions
  - Create preset management UI (save, load, edit, delete presets)
  - Implement usage tracking for automatic preset suggestions
  - Add quick preset buttons for frequently used combinations
  - Create preset sharing and import/export functionality
  - _Requirements: 4.3, 6.1, 6.2_

- [ ] 7. Implement enhanced notifications and feedback system
  - Create rich notification system with session insights
  - Add contextual break suggestions based on session data
  - Implement milestone celebrations and streak tracking
  - Create gentle refocusing prompts and productivity insights
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 7.1 Build enhanced notification system
  - Create NotificationManager for rich, contextual notifications
  - Implement session completion notifications with statistics
  - Add break time notifications with personalized suggestions
  - Create milestone and achievement notifications
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 7.2 Add smart break suggestions and productivity insights
  - Implement break activity suggestions based on session length and time
  - Create productivity scoring algorithm based on session patterns
  - Add gentle refocusing prompts for long inactive periods
  - Implement streak tracking and motivational feedback
  - _Requirements: 6.2, 6.4, 7.4_

- [ ] 8. Update dashboard and existing widgets
  - Refactor FocusSessionWidget to use global context
  - Update dashboard integration with new session system
  - Add session analytics to dashboard statistics
  - Create quick start options for common focus scenarios
  - _Requirements: 1.1, 6.3_

- [ ] 8.1 Refactor FocusSessionWidget for global state
  - Update src/components/FocusSessionWidget.tsx to consume FocusSessionContext
  - Remove local useState hooks for timeLeft, isRunning, currentSession
  - Replace local timer logic with global session state from context
  - Update toggleTimer and resetTimer to use context methods
  - Keep focusFeatures as local state for widget-specific UI
  - _Requirements: 1.1, 5.2_

- [ ] 8.2 Enhance dashboard with session analytics
  - Add session statistics to dashboard overview
  - Create productivity insights and trend visualization
  - Implement quick start buttons for common focus scenarios
  - Add recent session history and achievements display
  - _Requirements: 6.3, 7.3_

- [ ] 9. Implement performance optimizations and caching
  - Add audio file preloading and caching strategies
  - Implement Web Workers for accurate timer management
  - Optimize state updates and reduce unnecessary re-renders
  - Add memory leak prevention and cleanup
  - _Requirements: 8.1, 8.2, 8.4, 8.5_

- [ ] 9.1 Implement audio preloading and caching
  - Create audio preloading system for instant playback
  - Implement intelligent caching based on user preferences
  - Add offline audio playback capabilities
  - Create cache management and cleanup strategies
  - _Requirements: 8.1, 8.3_

- [ ] 9.2 Add Web Worker for accurate timer management
  - Create Web Worker for background timer processing
  - Implement accurate timing that works when tab is inactive
  - Add worker communication for timer updates
  - Create fallback for browsers without Web Worker support
  - _Requirements: 8.4_

- [ ] 10. Create comprehensive testing suite
  - Write unit tests for all core components and utilities
  - Add integration tests for cross-tab synchronization
  - Create end-to-end tests for complete user workflows
  - Implement performance testing for audio and state management
  - _Requirements: All requirements validation_

- [ ] 10.1 Write unit tests for core functionality
  - Test AudioManager audio loading and playback
  - Test FocusSessionProvider state management
  - Test CrossTabSynchronizer message handling
  - Test FloatingFocusWidget positioning and interactions
  - _Requirements: 1.1, 3.1, 5.1, 2.1_

- [ ] 10.2 Create integration and end-to-end tests
  - Test complete focus session workflows across multiple tabs
  - Test audio integration with session state changes
  - Test widget persistence and positioning across page navigation
  - Test error handling and recovery scenarios
  - _Requirements: 1.1, 3.1, 5.1, 2.1_

- [ ] 11. Create documentation and changelog
  - Write comprehensive README documenting all new features
  - Create user guide for advanced focus session capabilities
  - Document API changes and migration guide
  - Add troubleshooting guide for common issues
  - _Requirements: Documentation of implementation_