import { NextRequest, NextResponse } from 'next/server';
import { sendMail } from '@/app/lib/mailer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, html, text } = body || {};
    if (!to || !subject || (!html && !text)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const info = await sendMail({ to, subject, html, text });
    return NextResponse.json({ messageId: info.messageId || null, accepted: info.accepted || [] });
  } catch (error: any) {
    console.error('Email send error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}


