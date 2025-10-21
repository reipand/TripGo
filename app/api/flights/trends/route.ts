import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

interface FlightTrendResponse {
  success: boolean;
  data?: {
    route: string;
    average_price: number;
    price_trend: 'increasing' | 'decreasing' | 'stable';
    cheapest_price: number;
    most_expensive_price: number;
    flight_count: number;
    popular_times: {
      hour: number;
      count: number;
    }[];
    popular_airlines: {
      name: string;
      count: number;
      average_price: number;
    }[];
  };
  error?: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const days = parseInt(searchParams.get('days') || '30');

  if (!origin || !destination) {
    return NextResponse.json({
      success: false,
      error: 'Parameter origin dan destination diperlukan'
    } as FlightTrendResponse, { status: 400 });
  }

  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Get flight data for the route
    const { data: flights, error } = await supabase
      .from('schedules')
      .select(`
        price,
        departure_time,
        transportations!inner(name)
      `)
      .eq('routes.origin.name', origin)
      .eq('routes.destination.name', destination)
      .eq('transportations.type', 'Pesawat')
      .gte('departure_time', startDate.toISOString())
      .lte('departure_time', endDate.toISOString());

    if (error) {
      console.error('[FLIGHT TRENDS API] Supabase Error:', error);
      return NextResponse.json({
        success: false,
        error: 'Gagal mengambil data tren penerbangan',
        details: error.message
      } as FlightTrendResponse, { status: 500 });
    }

    if (!flights || flights.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          route: `${origin} → ${destination}`,
          average_price: 0,
          price_trend: 'stable' as const,
          cheapest_price: 0,
          most_expensive_price: 0,
          flight_count: 0,
          popular_times: [],
          popular_airlines: []
        }
      } as FlightTrendResponse);
    }

    // Calculate statistics
    const prices = flights.map(f => f.price);
    const average_price = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const cheapest_price = Math.min(...prices);
    const most_expensive_price = Math.max(...prices);

    // Calculate price trend (simplified)
    const firstHalf = prices.slice(0, Math.floor(prices.length / 2));
    const secondHalf = prices.slice(Math.floor(prices.length / 2));
    const firstHalfAvg = firstHalf.reduce((sum, price) => sum + price, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, price) => sum + price, 0) / secondHalf.length;
    
    let price_trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (secondHalfAvg > firstHalfAvg * 1.05) price_trend = 'increasing';
    else if (secondHalfAvg < firstHalfAvg * 0.95) price_trend = 'decreasing';

    // Calculate popular times
    const timeCounts: { [key: number]: number } = {};
    flights.forEach(flight => {
      const hour = new Date(flight.departure_time).getHours();
      timeCounts[hour] = (timeCounts[hour] || 0) + 1;
    });

    const popular_times = Object.entries(timeCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate popular airlines
    const airlineCounts: { [key: string]: { count: number; totalPrice: number } } = {};
    flights.forEach(flight => {
      const airline = flight.transportations.name;
      if (!airlineCounts[airline]) {
        airlineCounts[airline] = { count: 0, totalPrice: 0 };
      }
      airlineCounts[airline].count++;
      airlineCounts[airline].totalPrice += flight.price;
    });

    const popular_airlines = Object.entries(airlineCounts)
      .map(([name, data]) => ({
        name,
        count: data.count,
        average_price: data.totalPrice / data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        route: `${origin} → ${destination}`,
        average_price: Math.round(average_price),
        price_trend,
        cheapest_price,
        most_expensive_price,
        flight_count: flights.length,
        popular_times,
        popular_airlines
      }
    } as FlightTrendResponse);

  } catch (error: any) {
    console.error('[FLIGHT TRENDS API] Unexpected Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Terjadi kesalahan server.',
      details: error.message
    } as FlightTrendResponse, { status: 500 });
  }
}
