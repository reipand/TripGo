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

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        console.log(`[ADMIN SCHEDULE API] Updating schedule ${id}:`, body);

        const { data, error } = await supabaseAdmin
            .from('jadwal_kereta')
            .update({
                ...body,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[ADMIN SCHEDULE API] Update error:', error);
            return NextResponse.json({ error: 'Failed to update schedule', details: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('[ADMIN SCHEDULE API] Fatal error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        console.log(`[ADMIN SCHEDULE API] Deleting schedule ${id}`);

        const { error } = await supabaseAdmin
            .from('jadwal_kereta')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('[ADMIN SCHEDULE API] Delete error:', error);
            return NextResponse.json({ error: 'Failed to delete schedule', details: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Schedule deleted successfully' });

    } catch (error: any) {
        console.error('[ADMIN SCHEDULE API] Fatal error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
