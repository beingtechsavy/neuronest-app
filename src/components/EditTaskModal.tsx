'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { Loader2, X } from 'lucide-react';

// --- TYPE DEFINITIONS ---
interface EditTaskPayload {
  title: string;
  effort_units: number;
  scheduled_date: string;
  start_time?: string | null;
  end_time?: string | null;
  is_critical?: boolean;
}

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: EditTaskPayload) => Promise<void>;
  onUnschedule?: (taskId: number) => Promise<void>;
  taskId: number;
  currentTitle: string;
  currentEffort: number;
  currentDate: string;
  currentStartTime?: string | null;
  currentEndTime?: string | null;
  currentIsCritical?: boolean;
}

// --- MAIN COMPONENT ---
export default function EditTaskModal({
  isOpen,
  onClose,
  onSave,
  onUnschedule,
  taskId,
  currentTitle,
  currentEffort,
  currentDate,
  currentStartTime,
  currentEndTime,
  currentIsCritical = false
}: EditTaskModalProps) {
  // --- STATE MANAGEMENT ---
  const [title, setTitle] = useState(currentTitle);
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('0');
  const [date, setDate] = useState(currentDate);
  const [startTime, setStartTime] = useState(currentStartTime || '');
  const [endTime, setEndTime] = useState(currentEndTime || '');
  const [isCritical, setIsCritical] = useState(currentIsCritical);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUnscheduleConfirm, setShowUnscheduleConfirm] = useState(false);

  // --- SIDE EFFECTS ---
  // Reset form state when modal opens or the task being edited changes
  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle);
      setDate(currentDate);
      const h = Math.floor(currentEffort / 60);
      const m = currentEffort % 60;
      setHours(String(h));
      setMinutes(String(m));
      setStartTime(currentStartTime || '');
      setEndTime(currentEndTime || '');
      setIsCritical(currentIsCritical);
      setError(null); // Clear any previous errors
    }
  }, [currentTitle, currentEffort, currentDate, currentStartTime, currentEndTime, currentIsCritical, isOpen]);

  // --- EVENT HANDLERS ---
  const handleUnschedule = async () => {
    if (!onUnschedule) return;

    setIsLoading(true);
    setError(null);
    try {
      await onUnschedule(taskId);
      setShowUnscheduleConfirm(false);
      onClose();
    } catch (err: unknown) {
      console.error("Failed to unschedule task:", err);
      const errorMessage = err instanceof Error ? err.message : 'Please try again.';
      setError(`Failed to unschedule task: ${errorMessage}`);
      setShowUnscheduleConfirm(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Task title cannot be empty.");
      return;
    }

    const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
    if (totalMinutes <= 0) {
      setError("Task effort must be greater than 0 minutes.");
      return;
    }

    // Validate time inputs
    if (startTime && endTime) {
      // Convert time strings to minutes for comparison
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (startMinutes >= endMinutes) {
        setError("Start time must be before end time.");
        return;
      }
    } else if (startTime || endTime) {
      // If only one time is provided, require both
      setError("Please provide both start time and end time, or leave both empty.");
      return;
    }

    setIsLoading(true);
    try {
      await onSave({
        title: title.trim(),
        effort_units: totalMinutes,
        scheduled_date: date,
        start_time: startTime || null,
        end_time: endTime || null,
        is_critical: isCritical,
      });
      // The parent component will handle closing the modal on success
    } catch (err: unknown) {
      console.error("Failed to save task:", err);
      const errorMessage = err instanceof Error ? err.message : 'Please try again.';
      setError(`Failed to save changes: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDER ---
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
    >
      <div
        className="bg-slate-800 p-6 rounded-xl shadow-2xl w-full max-w-md border border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="edit-modal-title" className="text-xl font-bold text-white">Edit Task</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Title Input */}
          <div>
            <label htmlFor="task-title-edit" className="text-sm font-medium text-slate-400 mb-1 block">Title</label>
            <input
              id="task-title-edit"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-md text-white p-2 text-sm placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              required
              autoFocus
            />
          </div>

          {/* Date & Effort */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date-edit" className="text-sm font-medium text-slate-400 mb-1 block">Date</label>
              <input id="date-edit" type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md text-white p-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-400 mb-1 block">Effort</label>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="23" step="1" value={hours} onChange={e => setHours(e.target.value)} aria-label="Effort hours" className="w-full bg-slate-700 border border-slate-600 rounded-md text-white p-2 text-sm" />
                <span className="text-slate-400">h</span>
                <input type="number" min="0" max="59" step="5" value={minutes} onChange={e => setMinutes(e.target.value)} aria-label="Effort minutes" className="w-full bg-slate-700 border border-slate-600 rounded-md text-white p-2 text-sm" />
                <span className="text-slate-400">m</span>
              </div>
            </div>
          </div>

          {/* Time Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start-time-edit" className="text-sm font-medium text-slate-400 mb-1 block">Start Time</label>
              <input
                id="start-time-edit"
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-md text-white p-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
            </div>
            <div>
              <label htmlFor="end-time-edit" className="text-sm font-medium text-slate-400 mb-1 block">End Time</label>
              <input
                id="end-time-edit"
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-md text-white p-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
            </div>
          </div>

          {/* Critical Task Toggle */}
          <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
            <input
              id="is-critical-edit"
              type="checkbox"
              checked={isCritical}
              onChange={e => setIsCritical(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-orange-500 bg-slate-700 text-orange-500 flex-shrink-0 focus:ring-2 focus:ring-orange-500 focus:ring-offset-0 cursor-pointer"
            />
            <label htmlFor="is-critical-edit" className="flex flex-col flex-1 cursor-pointer">
              <span className="text-sm font-medium text-slate-200">Mark as Critical Task</span>
              <span className="text-xs text-slate-400 mt-0.5">High-priority or complex task requiring extra focus</span>
            </label>
            <span className="text-2xl flex-shrink-0" role="img" aria-label="Alert">⚠️</span>
          </div>

          {error && <p className="text-sm text-red-400 bg-red-500/10 p-2 rounded-md text-center">{error}</p>}

          {/* Action Buttons */}
          <div className="flex justify-between gap-3 mt-4 pt-4 border-t border-slate-700">
            <div>
              {onUnschedule && (
                <button
                  type="button"
                  onClick={() => setShowUnscheduleConfirm(true)}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-md bg-slate-600 text-white font-semibold text-sm hover:bg-slate-500 transition-colors disabled:opacity-50"
                >
                  Unschedule
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 rounded-md bg-slate-600 text-white font-semibold text-sm hover:bg-slate-500 transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={isLoading || !title.trim()} className="px-4 py-2 rounded-md bg-purple-600 text-white font-semibold text-sm hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>

        {/* Unschedule Confirmation Dialog */}
        {showUnscheduleConfirm && (
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center rounded-xl">
            <div className="bg-slate-700 p-6 rounded-lg shadow-xl max-w-sm mx-4">
              <h3 className="text-lg font-bold text-white mb-2">Unschedule Task?</h3>
              <p className="text-sm text-slate-300 mb-4">
                This will remove the scheduled date and time from this task. The task will be moved to your unscheduled tasks list.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowUnscheduleConfirm(false)}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-md bg-slate-600 text-white font-semibold text-sm hover:bg-slate-500 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnschedule}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-md bg-orange-600 text-white font-semibold text-sm hover:bg-orange-500 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading && <Loader2 size={16} className="animate-spin" />}
                  {isLoading ? 'Unscheduling...' : 'Unschedule'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
