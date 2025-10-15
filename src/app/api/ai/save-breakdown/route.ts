import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TaskBreakdownStep {
  step: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  estimatedMinutes: number;
  order: number;
  completionCriteria: string;
  encouragement?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { 
      userId, 
      breakdown, 
      taskTitle, 
      selectedSubjectId, 
      newSubjectName,
      createNewSubject,
      saveTasksToInbox = false
    } = await req.json();

    if (!userId || !breakdown || !Array.isArray(breakdown)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let subjectId = selectedSubjectId;
    let chapterId = null;

    // Step 1: Handle subject creation/selection
    if (createNewSubject && newSubjectName) {
      // Create new subject
      const { data: newSubject, error: subjectError } = await supabase
        .from('subjects')
        .insert({
          title: newSubjectName,
          color: '#8b5cf6', // Default purple color
          is_stressful: false,
          user_id: userId
        })
        .select('subject_id')
        .single();

      if (subjectError) {
        console.error('Error creating subject:', subjectError);
        return NextResponse.json(
          { error: 'Failed to create subject' },
          { status: 500 }
        );
      }

      subjectId = newSubject.subject_id;
    }

    // Step 2: Create AI breakdown record
    const { data: breakdownRecord, error: breakdownError } = await supabase
      .from('ai_breakdowns')
      .insert({
        user_id: userId,
        original_task_title: taskTitle,
        breakdown_steps: breakdown,
        steps_count: breakdown.length,
        subject_id: subjectId,
        save_type: createNewSubject ? 'new_subject' : 'existing_subject',
        total_estimated_minutes: breakdown.reduce((sum: number, step: TaskBreakdownStep) => sum + step.estimatedMinutes, 0)
      })
      .select('id')
      .single();

    if (breakdownError) {
      console.error('Error creating breakdown record:', breakdownError);
      return NextResponse.json(
        { error: 'Failed to save breakdown' },
        { status: 500 }
      );
    }

    const breakdownId = breakdownRecord.id;

    // Step 3: Create chapter for this breakdown
    if (subjectId) {
      const { data: newChapter, error: chapterError } = await supabase
        .from('chapters')
        .insert({
          title: taskTitle,
          subject_id: subjectId,
          order_idx: 999, // Will be updated by existing logic
          completed: false,
          is_stressful: breakdown.some((step: TaskBreakdownStep) => step.difficulty === 'HARD'),
          ai_generated: true,
          ai_breakdown_id: breakdownId
        })
        .select('chapter_id')
        .single();

      if (chapterError) {
        console.error('Error creating chapter:', chapterError);
        return NextResponse.json(
          { error: 'Failed to create chapter' },
          { status: 500 }
        );
      }

      chapterId = newChapter.chapter_id;

      // Update breakdown record with chapter_id
      await supabase
        .from('ai_breakdowns')
        .update({ chapter_id: chapterId })
        .eq('id', breakdownId);
    }

    // Step 4: Only create tasks if requested (not for reference-only breakdowns)
    if (saveTasksToInbox) {
      const tasksToInsert = breakdown.map((step: TaskBreakdownStep, index: number) => ({
        title: step.step,
        chapter_id: chapterId,
        user_id: userId,
        status: 'pending',
        ai_generated: true,
        ai_breakdown_id: breakdownId,
        difficulty_level: step.difficulty,
        estimated_minutes: step.estimatedMinutes,
        ai_step_order: step.order,
        effort_units: Math.ceil(step.estimatedMinutes / 15) || 1,
        created_at: new Date().toISOString()
      }));

      const { error: tasksError } = await supabase
        .from('tasks')
        .insert(tasksToInsert);

      if (tasksError) {
        console.error('Error creating tasks:', tasksError);
        return NextResponse.json(
          { error: 'Failed to create tasks' },
          { status: 500 }
        );
      }

      // Initialize progress tracking only if tasks were created
      await supabase
        .from('breakdown_progress')
        .insert({
          breakdown_id: breakdownId,
          user_id: userId,
          tasks_completed: 0,
          tasks_total: breakdown.length,
          completion_percentage: 0
        });
    }

    return NextResponse.json({
      success: true,
      breakdownId,
      subjectId,
      chapterId,
      tasksCreated: saveTasksToInbox ? breakdown.length : 0,
      savedAsReference: !saveTasksToInbox
    });

  } catch (error) {
    console.error('Save breakdown API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}