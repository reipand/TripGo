import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        console.log('[ADMIN SCHEDULE API] Creating schedule:', body);

        if (!body.train_id || !body.travel_date) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('jadwal_kereta')
            .insert([{
                train_id: body.train_id,
                travel_date: body.travel_date,
                status: body.status || 'scheduled',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) {
            console.error('[ADMIN SCHEDULE API] Insert error:', error);
            return NextResponse.json({ error: 'Failed to create schedule', details: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('[ADMIN SCHEDULE API] Fatal error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
