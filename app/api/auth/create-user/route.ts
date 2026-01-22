// app/api/auth/create-user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { email, password, user_metadata } = await request.json();

    console.log('Creating user with data:', {
      email,
      hasPassword: !!password,
      user_metadata
    });

    // Validasi input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password diperlukan' },
        { status: 400 }
      );
    }

    // 1. Create user di auth.users dengan error handling
    let authData, authError;
    
    try {
      const result = await supabaseAdmin.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password,
        email_confirm: true, // Auto confirm
        user_metadata: {
          ...user_metadata,
          registration_date: new Date().toISOString(),
          registration_method: 'email_password'
        }
      });
      
      authData = result.data;
      authError = result.error;
    } catch (authErr) {
      console.error('Auth creation catch error:', authErr);
      return NextResponse.json(
        { 
          error: 'Gagal membuat user',
          details: authErr.message,
          code: 'AUTH_CREATION_ERROR'
        },
        { status: 500 }
      );
    }

    if (authError) {
      console.error('Auth API error:', authError);
      
      // Handle specific errors
      if (authError.message.includes('User already registered')) {
        return NextResponse.json(
          { error: 'Email sudah terdaftar' },
          { status: 409 }
        );
      }
      
      if (authError.message.includes('Password')) {
        return NextResponse.json(
          { error: 'Password tidak valid. Minimal 6 karakter' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Database error creating new user',
          details: authError.message,
          code: authError.code
        },
        { status: 500 }
      );
    }

    if (!authData?.user) {
      return NextResponse.json(
        { error: 'User tidak berhasil dibuat' },
        { status: 500 }
      );
    }

    console.log('Auth user created successfully:', authData.user.id);

    // 2. Create record di public.users
    try {
      const { error: publicError } = await supabaseAdmin
        .from('users')
        .upsert({
          id: authData.user.id,
          email: authData.user.email,
          name: user_metadata?.name || null,
          phone: user_metadata?.phone || null,
          date_of_birth: user_metadata?.date_of_birth || null,
          gender: user_metadata?.gender || null,
          address: user_metadata?.address || null,
          email_verified: true,
          metadata: {
            ...user_metadata,
            registration_date: new Date().toISOString(),
            registration_method: 'email_password'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (publicError) {
        console.error('Error creating public.users record:', publicError);
        // Continue anyway, trigger will handle it
      }
    } catch (publicErr) {
      console.error('Public users creation error:', publicErr);
      // Continue, as auth user is created successfully
    }

    return NextResponse.json({
      success: true,
      userId: authData.user.id,
      email: authData.user.email,
      message: 'User berhasil dibuat'
    });

  } catch (error: any) {
    console.error('Unexpected error in create-user:', error);
    return NextResponse.json(
      { 
        error: 'Terjadi kesalahan sistem',
        details: error.message,
        code: 'UNEXPECTED_ERROR'
      },
      { status: 500 }
    );
  }
}