'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { Button, Checkbox, Input, Modal, ModalActions } from '@/components/ui';

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
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Edit task">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            autoFocus
            maxLength={200}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-[#DBDEE1]">Effort</legend>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="23"
                  step="1"
                  value={hours}
                  onChange={e => setHours(e.target.value)}
                  aria-label="Effort hours"
                  className="w-full rounded-xl border border-[#3F4147] bg-[#1E1F22] px-3 py-3.5 text-base text-[#F2F3F5] tabular-nums transition-colors focus:border-[#14B8A6] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                />
                <span className="text-sm text-[#949BA4]">h</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  step="5"
                  value={minutes}
                  onChange={e => setMinutes(e.target.value)}
                  aria-label="Effort minutes"
                  className="w-full rounded-xl border border-[#3F4147] bg-[#1E1F22] px-3 py-3.5 text-base text-[#F2F3F5] tabular-nums transition-colors focus:border-[#14B8A6] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                />
                <span className="text-sm text-[#949BA4]">m</span>
              </div>
            </fieldset>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Start time"
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
            />
            <Input
              label="End time"
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
            />
          </div>

          <Checkbox
            label="Mark as a critical task — one that needs extra focus and cannot slip"
            checked={isCritical}
            onChange={setIsCritical}
          />

          {error && (
            <p role="alert" className="rounded-xl border border-[#ED4245]/40 bg-[#ED4245]/10 px-3.5 py-2.5 text-sm text-[#FF6B6B]">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3 border-t border-[#383A40] pt-5 sm:flex-row sm:items-center sm:justify-between">
            {onUnschedule ? (
              <Button
                variant="ghost"
                onClick={() => setShowUnscheduleConfirm(true)}
                disabled={isLoading}
              >
                Unschedule
              </Button>
            ) : (
              <span />
            )}
            <ModalActions>
              <Button variant="secondary" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !title.trim()}>
                {isLoading && <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                {isLoading ? 'Saving…' : 'Save changes'}
              </Button>
            </ModalActions>
          </div>
        </form>
      </Modal>

      {/* Nested, not an absolutely-positioned overlay inside the dialog: the old
          version was clipped by the modal's own overflow at 320px. */}
      <Modal
        isOpen={showUnscheduleConfirm}
        onClose={() => setShowUnscheduleConfirm(false)}
        title="Unschedule this task?"
        size="sm"
      >
        <p className="mb-6 text-sm leading-relaxed text-[#DBDEE1]">
          The date and time will be cleared and the task moves back to your unscheduled
          list. Nothing is deleted.
        </p>
        <ModalActions>
          <Button
            variant="secondary"
            onClick={() => setShowUnscheduleConfirm(false)}
            disabled={isLoading}
          >
            Keep scheduled
          </Button>
          <Button onClick={handleUnschedule} disabled={isLoading}>
            {isLoading && <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
            {isLoading ? 'Unscheduling…' : 'Unschedule'}
          </Button>
        </ModalActions>
      </Modal>
    </>
  );
}
