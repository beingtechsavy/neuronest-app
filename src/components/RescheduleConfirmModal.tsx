'use client'

import React, { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'
import { Button, Input, Modal, ModalActions } from '@/components/ui'

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

  // Helper to format a Date object to a 'YYYY-MM-DD' string in local time
  const formatToDateInput = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Helper to format a Date object to an 'HH:mm' string in local time
  const formatToTimeInput = (d: Date) => {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
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

  // When the user clicks confirm, validate the inputs and send data to the parent.
  // The old version also shook the dialog on invalid input; a shake is a
  // vestibular trigger and carries no information the inline error does not.
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
      return;
    }

    // If validation passes, clear any errors and call the onConfirm prop
    setError(null);
    onConfirm({ taskId: details.taskId, newStartTime: finalStartTime, newEndTime: finalEndTime });
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reschedule task"
      description={details.title}
    >
      <div className="space-y-4">
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
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
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-[#FF6B6B]">{error}</p>
      )}

      <ModalActions>
        <Button variant="secondary" onClick={onClose}>
          <X size={16} aria-hidden="true" />
          Cancel
        </Button>
        <Button onClick={handleConfirmClick}>
          <Check size={16} aria-hidden="true" />
          Confirm
        </Button>
      </ModalActions>
    </Modal>
  )
}
