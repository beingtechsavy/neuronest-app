'use client'

import { useState } from 'react'
import { Wand2, Plus } from 'lucide-react'
import NewTaskModal from './NewTaskModal'

interface UnscheduledTask {
  task_id: number;
  title: string;
  chapters: {
    subjects: {
      title: string;
      color: string;
    } | null;
  } | null;
}

interface UnscheduledTasksProps {
  tasks: UnscheduledTask[];
  onSchedule: () => void;
  onTaskAdded: () => void;
  isScheduling: boolean;
  scheduleMessage: string;
}

export default function UnscheduledTasks({ tasks, onSchedule, onTaskAdded, isScheduling, scheduleMessage }: UnscheduledTasksProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <NewTaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskAdded={onTaskAdded}
      />
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 sm:p-6 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Task Inbox</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsModalOpen(true)} className="p-2 rounded-md hover:bg-slate-700 transition-colors text-slate-300" title="Add New Task"><Plus size={20} /></button>
            <button onClick={onSchedule} disabled={isScheduling} className="p-2 rounded-md hover:bg-slate-700 transition-colors text-purple-400 disabled:opacity-50" title="Schedule My Week"><Wand2 size={20} /></button>
          </div>
        </div>

        {scheduleMessage && <p className="text-center text-sm text-purple-300 mb-4">{scheduleMessage}</p>}

        <div className="flex-grow overflow-y-auto -mr-3 pr-3 space-y-2">
          {tasks.length === 0 ? (
            <p className="text-slate-400 text-center pt-8">Your inbox is clear!</p>
          ) : (
            tasks.map(task => (
              <div key={task.task_id} style={{...styles.taskItem, borderLeftColor: task.chapters?.subjects?.color || '#6366f1'}}>
                <span className="text-slate-200 text-sm">{task.title}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
    taskItem: {
        backgroundColor: '#334155',
        padding: '0.75rem 1rem',
        borderRadius: '0.5rem',
        borderLeftWidth: '4px',
    }
}
