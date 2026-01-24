// app/api/admin/trains/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabaseServer';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = createClient();
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Train ID is required' },
        { status: 400 }
      );
    }

    const { data: train, error } = await supabase
      .from('kereta')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Train query error:', error);
      return NextResponse.json(
        { error: 'Train not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: train
    });

  } catch (error: any) {
    console.error('Train API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = createClient();
    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Train ID is required' },
        { status: 400 }
      );
    }

    // Check if train exists
    const { data: existingTrain, error: checkError } = await supabase
      .from('trains')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError) {
      return NextResponse.json(
        { error: 'Train not found' },
        { status: 404 }
      );
    }

    // Allowed fields for update
    const allowedFields = [
      'nama_kereta',
      'kode_kereta',
      'operator',
      'tipe_kereta',
      'jumlah_kursi',
      'is_active',
      'fasilitas',
      'keterangan'
    ];

    // Filter only allowed fields
    const updateData: any = {};
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update train
    const { data, error } = await supabase
      .from('kereta')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update train error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Train updated successfully'
    });

  } catch (error: any) {
    console.error('Update train API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = createClient();
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Train ID is required' },
        { status: 400 }
      );
    }

    // Check if train exists
    const { data: existingTrain, error: checkError } = await supabase
      .from('trains')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError) {
      return NextResponse.json(
        { error: 'Train not found' },
        { status: 404 }
      );
    }

    // Check if train has active bookings
    const { count: activeBookings } = await supabase
      .from('bookings_kereta')
      .select('*', { count: 'exact', head: true })
      .eq('train_code', existingTrain.kode_kereta)
      .in('status', ['pending', 'confirmed']);

    if (activeBookings && activeBookings > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete train with active bookings. Consider marking as inactive instead.'
        },
        { status: 400 }
      );
    }

    // Soft delete: Mark as inactive
    const { data, error } = await supabase
      .from('kereta')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Delete train error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Train marked as inactive successfully',
      data
    });

  } catch (error: any) {
    console.error('Delete train API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}