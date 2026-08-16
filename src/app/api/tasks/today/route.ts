import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/serverAuth';

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

        const authUser = await getAuthenticatedUser(req);
        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = authUser.id;
        const client = getSupabaseClient();

        // Get today's start and end times in user's timezone
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
            .order('start_time', { ascending: true, nullsFirst: false });

        if (error) {
            console.error('Error fetching today\'s tasks:', error);
            return NextResponse.json(
                { error: 'Failed to fetch today\'s tasks' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            date: todayStr,
            tasks: tasks || []
        });

    } catch (error) {
        console.error('Get today\'s tasks API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
