'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToastContext } from '@/components/ToastProvider';
import UsageLimitModal from '@/components/UsageLimitModal';
import { getUserPlanInfo, UserPlanInfo } from '@/lib/subscriptionLimits';
import { Button, Checkbox, Input, Modal, ModalActions, Select } from '@/components/ui';

interface Subject {
  subject_id: number;
  title: string;
  chapters: Chapter[];
}

interface Chapter {
  chapter_id: number;
  title: string;
}

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskAdded: () => void;
}

export default function NewTaskModal({ isOpen, onClose, onTaskAdded }: NewTaskModalProps) {
  const { success, error } = useToastContext();
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('50');
  const [isStressful, setIsStressful] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [showUsageLimitModal, setShowUsageLimitModal] = useState(false);
  const [planInfo, setPlanInfo] = useState<UserPlanInfo | null>(null);

  // Fetch subjects and chapters when modal opens
  useEffect(() => {
    if (!isOpen) return;

    async function fetchSubjects() {
      setLoadingSubjects(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingSubjects(false);
        return;
      }

      const info = await getUserPlanInfo(user.id);
      setPlanInfo(info);

      const { data, error: fetchError } = await supabase
        .from('subjects')
        .select('subject_id, title, chapters (chapter_id, title)')
        .eq('user_id', user.id);

      if (fetchError) {
        console.error('Error fetching subjects:', fetchError);
        error('Failed to load subjects');
      } else {
        setSubjects(data ?? []);
      }
      setLoadingSubjects(false);
    }

    fetchSubjects();

    // Reset form on modal open
    setTitle('');
    setDeadline('');
    setHours('0');
    setMinutes('50');
    setIsStressful(false);
    setSelectedSubjectId('');
    setSelectedChapterId('');
    setChapters([]);
  }, [isOpen, error]);

  // Update chapters list when selected subject changes
  useEffect(() => {
    if (!selectedSubjectId) {
      setChapters([]);
      setSelectedChapterId('');
      return;
    }
    const subject = subjects.find(sub => sub.subject_id === parseInt(selectedSubjectId));
    setChapters(subject?.chapters ?? []);
    setSelectedChapterId('');
  }, [selectedSubjectId, subjects]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      error('Please enter a valid task title.');
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      error('User is not authenticated.');
      setLoading(false);
      return;
    }

    // Calculate total effort in minutes; default to 50 if zero or invalid
    const totalMinutes =
      (parseInt(hours) || 0) * 60 +
      (parseInt(minutes) || 0) || 50;

    const insertPayload = {
      title: title.trim(),
      deadline: deadline || null,
      effort_units: totalMinutes > 0 ? totalMinutes : 50,
      is_stressful: isStressful,
      chapter_id: selectedChapterId ? parseInt(selectedChapterId) : null,
      user_id: user.id,
      status: 'pending',
      task_status: 'inbox',
    };

    const { error: insertError } = await supabase.from('tasks').insert(insertPayload);

    if (insertError) {
      console.error('Error creating task:', insertError);
      if (insertError.message?.includes('TASK_LIMIT_REACHED') || insertError.code === 'P0001') {
        const info = await getUserPlanInfo(user.id);
        setPlanInfo(info);
        setShowUsageLimitModal(true);
      } else {
        error('Failed to create task. Please try again.');
      }
    } else {
      success('Task created.');
      onTaskAdded();
      onClose();
    }
    setLoading(false);
  }

  if (!isOpen) return null;

  const chapterDisabled = !selectedSubjectId;

  return (
    <>
      {showUsageLimitModal && planInfo && (
        <UsageLimitModal
          isOpen={showUsageLimitModal}
          onClose={() => setShowUsageLimitModal(false)}
          planInfo={planInfo}
          limitType="subjects"
          onUpgrade={() => {
            window.location.href = '/pricing';
          }}
        />
      )}

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Add a task"
        description="One task, one line. You can size it later."
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="task-title"
            label="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Read the first five pages"
            autoFocus
            required
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              id="subject"
              label="Project"
              value={selectedSubjectId}
              onChange={e => setSelectedSubjectId(e.target.value)}
              disabled={loadingSubjects}
            >
              <option value="">{loadingSubjects ? 'Loading projects…' : 'No project'}</option>
              {subjects.map(subject => (
                <option key={subject.subject_id} value={subject.subject_id}>{subject.title}</option>
              ))}
            </Select>

            <Select
              id="chapter"
              label="Area"
              value={selectedChapterId}
              onChange={e => setSelectedChapterId(e.target.value)}
              disabled={chapterDisabled}
              hint={chapterDisabled ? 'Choose a project first.' : undefined}
            >
              <option value="">No area</option>
              {chapters.map(chapter => (
                <option key={chapter.chapter_id} value={chapter.chapter_id}>{chapter.title}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <fieldset>
              <legend className="mb-2 block text-sm font-medium text-[#DBDEE1]">Effort</legend>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="23"
                  step="1"
                  value={hours}
                  onChange={e => setHours(e.target.value)}
                  aria-label="Effort hours"
                  placeholder="0"
                  containerClassName="flex-1"
                />
                <span className="text-sm text-[#949BA4]" aria-hidden="true">h</span>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  step="5"
                  value={minutes}
                  onChange={e => setMinutes(e.target.value)}
                  aria-label="Effort minutes"
                  placeholder="50"
                  containerClassName="flex-1"
                />
                <span className="text-sm text-[#949BA4]" aria-hidden="true">m</span>
              </div>
            </fieldset>

            <Input
              id="deadline"
              type="date"
              label="Deadline"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
            />
          </div>

          <Checkbox
            label="Mark as high-priority"
            checked={isStressful}
            onChange={setIsStressful}
          />

          <ModalActions>
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? 'Saving…' : 'Add task'}
            </Button>
          </ModalActions>
        </form>
      </Modal>
    </>
  );
}
