import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

export async function GET() {
  try {
    // Ambil 10 stasiun populer (yang memiliki kode umum)
    const { data: stations, error } = await supabase
      .from('stasiun')
      .select('id, code, name, city, type')
      .in('code', [
        'GMR', 'BD', 'SBY', 'SMG', 'YK', 
        'CRB', 'SLO', 'MLG', 'BKS', 'TNG'
      ])
      .limit(10)
      .order('code');

    if (error) {
      console.error('Error fetching popular stations:', error);
      // Fallback data
      const fallbackStations = [
        { id: '1', code: 'GMR', name: 'Gambir', city: 'Jakarta', type: 'utama' },
        { id: '2', code: 'BD', name: 'Bandung', city: 'Bandung', type: 'utama' },
        { id: '3', code: 'SBY', name: 'Surabaya', city: 'Surabaya', type: 'utama' },
        { id: '4', code: 'SMG', name: 'Semarang', city: 'Semarang', type: 'utama' },
        { id: '5', code: 'YK', name: 'Yogyakarta', city: 'Yogyakarta', type: 'utama' },
      ];
      return NextResponse.json(fallbackStations);
    }

    return NextResponse.json(stations || []);
    
  } catch (error: any) {
    console.error('Error in popular stations:', error);
    // Fallback data
    const fallbackStations = [
      { id: '1', code: 'GMR', name: 'Gambir', city: 'Jakarta', type: 'utama' },
      { id: '2', code: 'BD', name: 'Bandung', city: 'Bandung', type: 'utama' },
      { id: '3', code: 'SBY', name: 'Surabaya', city: 'Surabaya', type: 'utama' },
      { id: '4', code: 'SMG', name: 'Semarang', city: 'Semarang', type: 'utama' },
      { id: '5', code: 'YK', name: 'Yogyakarta', city: 'Yogyakarta', type: 'utama' },
    ];
    return NextResponse.json(fallbackStations);
  }
}