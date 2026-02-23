import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

export async function GET(req: NextRequest) {
    try {
        // Check if database service is configured
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json(
                { error: 'Database service is not configured' },
                { status: 503 }
            );
        }

        // Get userId from query parameters
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        // Validate required fields
        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        const client = getSupabaseClient();

        // Get today's start and end times in user's timezone (using UTC for db matching as a basic implementation)
        // Note: A more robust implementation would take the user's timezone from the client
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        // Fetch tasks scheduled for today
        const { data: tasks, error } = await client
            .from('tasks')
            .select('task_id, title, estimated_minutes, start_time, end_time, task_status')
            .eq('user_id', userId)
            .eq('scheduled_date', todayStr)
            // .neq('task_status', 'completed') // Let's fetch all and filter in frontend to allow for "all done" state
            .order('start_time', { ascending: true, nullsFirst: false });

        if (error) {
            console.error('Error fetching today tasks:', error);
            return NextResponse.json(
                { error: 'Failed to fetch today tasks' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            tasks: tasks || []
        });

    } catch (error) {
        console.error('Today tasks API error:', error);

        return NextResponse.json(
            { error: 'Failed to fetch today tasks' },
            { status: 500 }
        );
    }
}
