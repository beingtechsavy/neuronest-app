import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserPlanInfo, canCreateSubject } from '@/lib/subscriptionLimits';

// Lazy initialization of Supabase client
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabase) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration is missing. Please check your environment variables.');
    }
    
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return supabase;
}

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
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Database service is not configured' },
        { status: 503 }
      );
    }

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

    const client = getSupabaseClient();

    // Validate subscription status before allowing save
    const planInfo = await getUserPlanInfo(userId);
    if (!planInfo) {
      return NextResponse.json(
        { error: 'Unable to verify subscription status' },
        { status: 403 }
      );
    }

    // Check if user can create subjects (if creating new subject)
    if (createNewSubject && newSubjectName) {
      const canCreate = await canCreateSubject(userId);
      if (!canCreate) {
        return NextResponse.json(
          { 
            error: planInfo.subscription_active 
              ? 'Subject limit reached for your plan' 
              : 'Subscription expired - upgrade to create more subjects',
            planType: planInfo.plan_type,
            subscriptionActive: planInfo.subscription_active
          },
          { status: 403 }
        );
      }
    }

    let subjectId = selectedSubjectId;
    let chapterId = null;

    // Step 1: Handle subject creation/selection
    if (createNewSubject && newSubjectName) {
      // Create new subject
      const { data: newSubject, error: subjectError } = await client
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
    const { data: breakdownRecord, error: breakdownError } = await client
      .from('ai_breakdowns')
      .insert({
        user_id: userId,
        original_task_title: taskTitle || 'AI Generated Task',
        original_task_description: null,
        subject: selectedSubjectId ? null : newSubjectName,
        deadline: null,
        breakdown_steps: breakdown,
        steps_count: breakdown.length,
        subject_id: subjectId,
        save_type: createNewSubject ? 'new_subject' : 'existing_subject',
        total_estimated_minutes: breakdown.reduce((sum: number, step: TaskBreakdownStep) => sum + step.estimatedMinutes, 0)
      })
      .select('id')
      .single();

    if (breakdownError) {
      console.error('Error creating breakdown record:', {
        error: breakdownError,
        data: {
          user_id: userId,
          original_task_title: taskTitle || 'AI Generated Task',
          breakdown_steps: breakdown,
          steps_count: breakdown.length,
          subject_id: subjectId
        }
      });
      return NextResponse.json(
        { error: `Failed to save breakdown: ${breakdownError.message}` },
        { status: 500 }
      );
    }

    const breakdownId = breakdownRecord.id as string;

    // Step 3: Create chapter for this breakdown
    if (subjectId) {
      const { data: newChapter, error: chapterError } = await client
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

      chapterId = newChapter.chapter_id as string;

      // Update breakdown record with chapter_id
      await client
        .from('ai_breakdowns')
        .update({ chapter_id: chapterId })
        .eq('id', breakdownId);
    }

    // Step 4: Always create tasks from breakdown steps
    if (chapterId) {
      const tasksToInsert = breakdown.map((step: TaskBreakdownStep, index: number) => ({
        title: step.step,
        chapter_id: chapterId,
        user_id: userId,
        status: 'pending',
        task_status: 'breakdown', // New workflow status
        ai_generated: true,
        ai_breakdown_id: breakdownId,
        difficulty_level: step.difficulty,
        estimated_minutes: step.estimatedMinutes,
        ai_step_order: step.order,
        effort_units: Math.ceil(step.estimatedMinutes / 15) || 1,
        created_at: new Date().toISOString()
      }));

      const { error: tasksError } = await client
        .from('tasks')
        .insert(tasksToInsert);

      if (tasksError) {
        console.error('Error creating tasks:', tasksError);
        return NextResponse.json(
          { error: 'Failed to create tasks' },
          { status: 500 }
        );
      }

      // Initialize progress tracking
      await client
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
      tasksCreated: breakdown.length,
      savedAsReference: false
    });

  } catch (error) {
    console.error('Save breakdown API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}