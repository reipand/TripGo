// app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabaseServer';

export async function GET() {
  try {
    const supabase = createClient();

    const { data: settings, error } = await supabase
      .from('settings')
      .select('*')
      .order('category');

    if (error) {
      console.error('Settings query error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Group settings by category
    const groupedSettings = settings?.reduce((acc: any, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: groupedSettings || {}
    });

  } catch (error: any) {
    console.error('Settings API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    if (!body.key || body.value === undefined) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      );
    }

    // Update setting
    const { data, error } = await supabase
      .from('settings')
      .update({
        value: body.value,
        updated_at: new Date().toISOString(),
        updated_by: 'admin' // You might want to get this from session
      })
      .eq('key', body.key)
      .select()
      .single();

    if (error) {
      console.error('Update setting error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Setting updated successfully'
    });

  } catch (error: any) {
    console.error('Update settings API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}