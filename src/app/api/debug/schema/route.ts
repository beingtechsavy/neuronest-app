import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Attempt to query the first row to infer schema
        const { data: rows, error } = await supabase
            .from('ai_breakdowns')
            .select('*')
            .limit(1);

        if (error) {
            return NextResponse.json({ error: error.message, details: error }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            schema_sample: rows && rows.length > 0 ? Object.keys(rows[0]) : 'Table is empty',
            sample_data: rows && rows.length > 0 ? rows[0] : null
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
