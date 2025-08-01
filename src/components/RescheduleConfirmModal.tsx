'use client'

import React, { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'

interface RescheduleDetails {
  taskId: number;
  title: string;
  newStartTime: Date;
  newEndTime: Date;
}

interface RescheduleConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (details: { taskId: number; newStartTime: Date; newEndTime: Date; }) => void
  details: RescheduleDetails | null
}

export default function RescheduleConfirmModal({ isOpen, onClose, onConfirm, details }: RescheduleConfirmModalProps) {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [error, setError] = useState<string | null>(null);

  // Helper to format a Date object to a 'YYYY-MM-DD' string in UTC
  const formatToDateInput = (d: Date) => {
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Helper to format a Date object to an 'HH:mm' string in UTC
  const formatToTimeInput = (d: Date) => {
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // When the modal opens or the proposed details change, update the local state
  useEffect(() => {
    if (details) {
      setDate(formatToDateInput(details.newStartTime));
      setStartTime(formatToTimeInput(details.newStartTime));
      setEndTime(formatToTimeInput(details.newEndTime));
      setError(null); // Clear previous errors
    }
  }, [details]);

  if (!isOpen || !details) return null;

  // When the user clicks confirm, validate the inputs and send data to the parent
  const handleConfirmClick = () => {
    const [year, month, day] = date.split('-').map(Number);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    // Construct new Date objects using UTC to prevent timezone issues
    const finalStartTime = new Date(Date.UTC(year, month - 1, day, startHour, startMinute));
    const finalEndTime = new Date(Date.UTC(year, month - 1, day, endHour, endMinute));

    // Validation: Ensure the end time is after the start time
    if (finalEndTime <= finalStartTime) {
      setError('End time must be after start time.');
      // Trigger a shake animation by adding and removing a class
      const modal = document.getElementById('reschedule-modal');
      modal?.classList.add('shake');
      setTimeout(() => modal?.classList.remove('shake'), 500);
      return;
    }

    // If validation passes, clear any errors and call the onConfirm prop
    setError(null);
    onConfirm({ taskId: details.taskId, newStartTime: finalStartTime, newEndTime: finalEndTime });
  }

  return (
    <>
      {/* CSS for the shake animation */}
      <style>{`
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
        .shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
      <div 
        className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[50]"
        onClick={onClose}
      >
        <div 
          id="reschedule-modal"
          className="bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-2xl w-[90%] max-w-md border border-slate-700 text-center" 
          onClick={e => e.stopPropagation()}
        >
          <h3 className="text-xl font-bold text-slate-100 mb-2">Confirm Reschedule</h3>
          <p className="text-purple-400 font-semibold mb-6 text-lg">&ldquo;{details.title}&rdquo;</p>
          
          <div className="space-y-4">
            <div className="text-left">
              <label htmlFor="date" className="block text-sm font-medium text-slate-300 mb-2">Date</label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex gap-4 text-left">
              <div className="flex-1">
                <label htmlFor="startTime" className="block text-sm font-medium text-slate-300 mb-2">Start Time</label>
                <input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="endTime" className="block text-sm font-medium text-slate-300 mb-2">End Time</label>
                <input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Error Message Display */}
          {error && (
            <p className="text-red-400 text-sm mt-4">{error}</p>
          )}

          <div className="flex gap-4 mt-8">
            <button 
              onClick={onClose} 
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-600 text-slate-200 font-semibold hover:bg-slate-500 transition-colors"
            >
              <X size={18} /> Cancel
            </button>
            <button 
              onClick={handleConfirmClick} 
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-500 transition-colors"
            >
              <Check size={18} /> Confirm
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
