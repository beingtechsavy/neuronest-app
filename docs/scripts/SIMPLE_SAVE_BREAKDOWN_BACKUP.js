// SIMPLE SAVE BREAKDOWN - Backup version that works with basic tables only
// Use this if the full AI tables approach doesn't work

export async function POST(req) {
  try {
    const { 
      userId, 
      breakdown, 
      taskTitle, 
      selectedSubjectId, 
      newSubjectName,
      createNewSubject,
      saveTasksToInbox = true
    } = await req.json();

    if (!userId || !breakdown || !Array.isArray(breakdown)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client = getSupabaseClient();
    let subjectId = selectedSubjectId;
    let chapterId = null;

    // Step 1: Handle subject creation/selection
    if (createNewSubject && newSubjectName) {
      const { data: newSubject, error: subjectError } = await client
        .from('subjects')
        .insert({
          title: newSubjectName,
          color: '#8b5cf6',
          is_stressful: false,
          user_id: userId
        })
        .select('subject_id')
        .single();

      if (subjectError) {
        console.error('Error creating subject:', subjectError);
        return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 });
      }
      subjectId = newSubject.subject_id;
    }

    // Step 2: Create chapter (using basic columns only)
    if (subjectId) {
      const { data: newChapter, error: chapterError } = await client
        .from('chapters')
        .insert({
          title: taskTitle || 'AI Generated Tasks',
          subject_id: subjectId,
          order_idx: 999,
          completed: false,
          is_stressful: breakdown.some(step => step.difficulty === 'HARD')
        })
        .select('chapter_id')
        .single();

      if (chapterError) {
        console.error('Error creating chapter:', chapterError);
        return NextResponse.json({ error: 'Failed to create chapter' }, { status: 500 });
      }
      chapterId = newChapter.chapter_id;
    }

    // Step 3: Create tasks (using basic columns only)
    if (saveTasksToInbox && chapterId) {
      const tasksToInsert = breakdown.map((step, index) => ({
        title: step.step,
        chapter_id: chapterId,
        user_id: userId,
        status: 'pending',
        effort_units: Math.ceil(step.estimatedMinutes / 15) || 1
      }));

      const { error: tasksError } = await client
        .from('tasks')
        .insert(tasksToInsert);

      if (tasksError) {
        console.error('Error creating tasks:', tasksError);
        return NextResponse.json({ error: 'Failed to create tasks' }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      subjectId,
      chapterId,
      tasksCreated: saveTasksToInbox ? breakdown.length : 0,
      message: 'Breakdown saved successfully!'
    });

  } catch (error) {
    console.error('Save breakdown API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}