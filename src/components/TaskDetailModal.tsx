// 'use client'

// import { X, Tag, Clock, Folder, Edit, Trash2 } from 'lucide-react'
// import React from 'react'

// // Define full CalendarTask interface as in your main calendar page
// interface CalendarTask {
//   task_id: number;
//   title: string;
//   scheduled_date: string;
//   start_time: string | null;
//   end_time: string | null;
//   effort_units: number | null;
//   chapters: { 
//     title: string;
//     subjects: {
//       title: string;
//       color: string;
//     } | null;
//   } | null;
//   user_id: string;
//   chapter_id: number | null;
//   deadline: string | null;
//   status: string;
//   is_stressful: boolean;
// }

// // The task prop includes startTime and endTime Date objects
// type DetailedTask = CalendarTask & { startTime: Date; endTime: Date; }

// interface TaskDetailModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   task: DetailedTask | null;
//   onDelete: (task: CalendarTask) => void;
//   onEdit: (task: CalendarTask) => void;
// }

// export default function TaskDetailModal({ isOpen, onClose, task, onDelete, onEdit }: TaskDetailModalProps) {
//   if (!isOpen || !task) return null;

//   // Format time for display in user's locale, 12-hour format
//   const formatTime = (date: Date) => {
//     return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
//   };

//   const subjectTitle = task.chapters?.subjects?.title || "Uncategorized";
//   const subjectColor = task.chapters?.subjects?.color || '#6366f1';
//   const chapterTitle = task.chapters?.title;

//   return (
//     <div style={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="task-detail-title">
//       <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
//         <div style={{ ...styles.colorBar, backgroundColor: subjectColor }}></div>
//         <button onClick={onClose} style={styles.closeButton} aria-label="Close task detail modal">
//           <X size={20} />
//         </button>

//         <div style={styles.content}>
//           <h2 id="task-detail-title" style={styles.title}>{task.title}</h2>

//           <div style={styles.detailItem}>
//             <Tag size={16} style={{ ...styles.icon, color: subjectColor }} />
//             <span style={styles.detailText}>{subjectTitle}</span>
//           </div>

//           {chapterTitle && (
//             <div style={styles.detailItem}>
//               <Folder size={16} style={styles.icon} />
//               <span style={styles.detailText}>{chapterTitle}</span>
//             </div>
//           )}

//           <div style={styles.detailItem}>
//             <Clock size={16} style={styles.icon} />
//             <span style={styles.detailText}>{formatTime(task.startTime)} - {formatTime(task.endTime)}</span>
//           </div>
//         </div>

//         <div style={styles.footer}>
//           <button
//             style={{ ...styles.actionButton, ...styles.deleteButton }}
//             onClick={() => onDelete(task)}
//             aria-label={`Delete task ${task.title}`}
//           >
//             <Trash2 size={16} />
//             <span>Delete</span>
//           </button>
//           <button
//             style={styles.actionButton}
//             onClick={() => onEdit(task)}
//             aria-label={`Edit task ${task.title}`}
//           >
//             <Edit size={16} />
//             <span>Edit</span>
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// const styles: { [key: string]: React.CSSProperties } = {
//   overlay: {
//     position: 'fixed',
//     top: 0, left: 0, right: 0, bottom: 0,
//     backgroundColor: 'rgba(15, 23, 42, 0.9)',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     zIndex: 5000,
//     backdropFilter: 'blur(8px)',
//   },
//   modal: {
//     background: '#1e293b',
//     borderRadius: '16px',
//     boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
//     width: '90%',
//     maxWidth: '400px',
//     border: '1px solid #334155',
//     color: '#e2e8f0',
//     overflow: 'hidden',
//     position: 'relative',
//   },
//   colorBar: {
//     height: '8px',
//     width: '100%',
//   },
//   closeButton: {
//     position: 'absolute',
//     top: '16px',
//     right: '16px',
//     background: 'rgba(71, 85, 105, 0.5)',
//     border: 'none',
//     color: '#e2e8f0',
//     cursor: 'pointer',
//     borderRadius: '50%',
//     width: '32px',
//     height: '32px',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   content: {
//     padding: '1.5rem 2rem 1rem 2rem',
//   },
//   title: {
//     fontSize: '1.5rem',
//     fontWeight: 'bold',
//     color: '#ffffff',
//     marginBottom: '1.5rem',
//     paddingRight: '40px',
//   },
//   detailItem: {
//     display: 'flex',
//     alignItems: 'center',
//     gap: '1rem',
//     marginBottom: '1rem',
//   },
//   icon: {
//     color: '#94a3b8',
//     flexShrink: 0,
//   },
//   detailText: {
//     fontSize: '1rem',
//     color: '#cbd5e1',
//   },
//   footer: {
//     display: 'flex',
//     gap: '0.5rem',
//     padding: '0 1rem 1rem 1rem',
//     borderTop: '1px solid #334155',
//     backgroundColor: 'rgba(30, 41, 59, 0.5)',
//   },
//   actionButton: {
//     flex: 1,
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: '0.5rem',
//     padding: '0.75rem',
//     border: 'none',
//     borderRadius: '8px',
//     backgroundColor: '#334155',
//     color: '#cbd5e1',
//     fontSize: '0.875rem',
//     fontWeight: '600',
//     cursor: 'pointer',
//     transition: 'background-color 0.2s',
//   },
//   deleteButton: {
//     backgroundColor: '#9f1239',
//     color: '#fecaca',
//   }
// };



'use client';

import React from 'react';
import { X, Tag, Clock, Folder, Edit, Trash2 } from 'lucide-react';

// --- TYPE DEFINITIONS ---
// It's best practice to move shared types to a central file (e.g., @/types/index.ts)
interface CalendarTask {
  task_id: number;
  title: string;
  scheduled_date: string;
  start_time: string | null;
  end_time: string | null;
  effort_units: number | null;
  chapters: {
    title: string;
    subjects: {
      title: string;
      color: string;
    } | null;
  } | null;
  user_id: string;
  chapter_id: number | null;
  deadline: string | null;
  status: string;
  is_stressful: boolean;
}

type DetailedTask = CalendarTask & { startTime: Date; endTime: Date; };

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: DetailedTask | null;
  onDelete: (task: CalendarTask) => void;
  onEdit: (task: CalendarTask) => void;
}

// --- MAIN COMPONENT ---
export default function TaskDetailModal({ isOpen, onClose, task, onEdit, onDelete }: TaskDetailModalProps) {
  if (!isOpen || !task) return null;

  // --- BUG FIX IS HERE ---
  // This function now explicitly uses the 'UTC' timeZone, ensuring the displayed
  // time matches the data in the rest of the application, regardless of the
  // user's local timezone.
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC', // This is the critical fix
    });
  };

  const subjectTitle = task.chapters?.subjects?.title || "Uncategorized";
  const subjectColor = task.chapters?.subjects?.color || '#6366f1';
  const chapterTitle = task.chapters?.title;

  return (
    <div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-detail-title"
    >
      <div
        className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm border border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Color Bar */}
        <div style={{ backgroundColor: subjectColor }} className="h-2 w-full" />

        {/* Header */}
        <div className="p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
            aria-label="Close task detail modal"
          >
            <X size={20} />
          </button>
          <h2 id="task-detail-title" className="text-2xl font-bold text-white pr-8">{task.title}</h2>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-4">
            <div className="flex items-center gap-4">
                <Tag size={18} className="text-slate-400 flex-shrink-0" style={{ color: subjectColor }} />
                <span className="text-base text-slate-200">{subjectTitle}</span>
            </div>
            {chapterTitle && (
                <div className="flex items-center gap-4">
                    <Folder size={18} className="text-slate-400 flex-shrink-0" />
                    <span className="text-base text-slate-200">{chapterTitle}</span>
                </div>
            )}
            <div className="flex items-center gap-4">
                <Clock size={18} className="text-slate-400 flex-shrink-0" />
                <span className="text-base text-slate-200">{formatTime(task.startTime)} - {formatTime(task.endTime)} (UTC)</span>
            </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 bg-slate-900/50 border-t border-slate-700">
          <button
            onClick={() => onDelete(task)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-semibold text-sm bg-red-800/80 text-red-200 hover:bg-red-700 transition-colors"
            aria-label={`Delete task ${task.title}`}
          >
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
          <button
            onClick={() => onEdit(task)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-semibold text-sm bg-slate-600 text-white hover:bg-slate-500 transition-colors"
            aria-label={`Edit task ${task.title}`}
          >
            <Edit size={16} />
            <span>Edit</span>
          </button>
        </div>
      </div>
    </div>
  );
}
