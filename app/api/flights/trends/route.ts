import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

interface FlightTrendData {
  route: string;
  average_price: number;
  price_trend: 'increasing' | 'decreasing' | 'stable';
  trend_percentage: number;
  cheapest_price: number;
  most_expensive_price: number;
  flight_count: number;
  price_history: {
    date: string;
    average_price: number;
  }[];
  popular_times: {
    hour: number;
    count: number;
    percentage: number;
  }[];
  popular_airlines: {
    name: string;
    count: number;
    average_price: number;
    market_share: number;
  }[];
  price_distribution: {
    range: string;
    count: number;
  }[];
}

interface FlightTrendResponse {
  success: boolean;
  data?: FlightTrendData;
  error?: string;
  message?: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const days = parseInt(searchParams.get('days') || '30');
  const limit = parseInt(searchParams.get('limit') || '1000');

  if (!origin || !destination) {
    return NextResponse.json({
      success: false,
      error: 'Missing required parameters',
      message: 'Parameter origin dan destination diperlukan'
    } as FlightTrendResponse, { status: 400 });
  }

  if (days < 1 || days > 365) {
    return NextResponse.json({
      success: false,
      error: 'Invalid days parameter',
      message: 'Parameter days harus antara 1 hingga 365'
    } as FlightTrendResponse, { status: 400 });
  }

  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get flight data for the route with proper joins
    const { data: flights, error } = await supabase
      .from('schedules')
      .select(`
        id,
        price,
        departure_time,
        transportations:transportation_id (
          name,
          type
        ),
        routes:route_id (
          origin:origin_id (
            name
          ),
          destination:destination_id (
            name
          )
        )
      `)
      .eq('routes.origin.name', origin)
      .eq('routes.destination.name', destination)
      .eq('transportations.type', 'Pesawat')
      .gte('departure_time', startDate.toISOString())
      .lte('departure_time', endDate.toISOString())
      .order('departure_time', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[FLIGHT TRENDS API] Supabase Query Error:', error);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Gagal mengambil data tren penerbangan'
      } as FlightTrendResponse, { status: 500 });
    }

    if (!flights || flights.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          route: `${origin} → ${destination}`,
          average_price: 0,
          price_trend: 'stable',
          trend_percentage: 0,
          cheapest_price: 0,
          most_expensive_price: 0,
          flight_count: 0,
          price_history: [],
          popular_times: [],
          popular_airlines: [],
          price_distribution: []
        },
        message: 'Tidak ada data penerbangan ditemukan untuk rute ini'
      } as FlightTrendResponse);
    }

    // Process flights data
    const validFlights = flights.filter(f => 
      f.price && 
      f.departure_time && 
      f.transportations && 
      f.routes
    );

    if (validFlights.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          route: `${origin} → ${destination}`,
          average_price: 0,
          price_trend: 'stable',
          trend_percentage: 0,
          cheapest_price: 0,
          most_expensive_price: 0,
          flight_count: 0,
          price_history: [],
          popular_times: [],
          popular_airlines: [],
          price_distribution: []
        },
        message: 'Data penerbangan tidak valid'
      } as FlightTrendResponse);
    }

    // Calculate basic statistics
    const prices = validFlights.map(f => f.price);
    const average_price = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const cheapest_price = Math.min(...prices);
    const most_expensive_price = Math.max(...prices);

    // Group by date for price history
    const priceByDate: { [key: string]: number[] } = {};
    validFlights.forEach(flight => {
      const date = new Date(flight.departure_time).toISOString().split('T')[0];
      if (!priceByDate[date]) {
        priceByDate[date] = [];
      }
      priceByDate[date].push(flight.price);
    });

    const price_history = Object.entries(priceByDate)
      .map(([date, prices]) => ({
        date,
        average_price: prices.reduce((sum, price) => sum + price, 0) / prices.length
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate price trend with percentage
    let final_trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    let final_trend_percentage = 0;
    if (price_history.length >= 2) {
      const recentPrices = price_history.slice(-7); // Last 7 days
      const olderPrices = price_history.slice(0, Math.max(0, price_history.length - 7));
      
      if (olderPrices.length > 0 && recentPrices.length > 0) {
        const olderAvg = olderPrices.reduce((sum, p) => sum + p.average_price, 0) / olderPrices.length;
        const recentAvg = recentPrices.reduce((sum, p) => sum + p.average_price, 0) / recentPrices.length;
        const trend_percentage = ((recentAvg - olderAvg) / olderAvg) * 100;
        
        let price_trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        if (trend_percentage > 5) price_trend = 'increasing';
        else if (trend_percentage < -5) price_trend = 'decreasing';
        
        // Use these calculated values
        final_trend = price_trend;
        final_trend_percentage = trend_percentage;
      }
    }

    // Calculate popular times
    const timeCounts: { [key: number]: number } = {};
    validFlights.forEach(flight => {
      const hour = new Date(flight.departure_time).getHours();
      timeCounts[hour] = (timeCounts[hour] || 0) + 1;
    });

    const totalFlights = validFlights.length;
    const popular_times = Object.entries(timeCounts)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        count,
        percentage: (count / totalFlights) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate popular airlines
    const airlineStats: { 
      [key: string]: { 
        count: number; 
        totalPrice: number;
        flights: number[] 
      } 
    } = {};

    validFlights.forEach(flight => {
      // Handle transportations as array or object
      let airline = 'Unknown';
      if (Array.isArray(flight.transportations) && flight.transportations.length > 0) {
        airline = flight.transportations[0].name || 'Unknown';
      } else if (
        flight.transportations &&
        typeof flight.transportations === 'object' &&
        'name' in flight.transportations &&
        typeof flight.transportations.name === 'string'
      ) {
        airline = flight.transportations.name || 'Unknown';
      }
      if (!airlineStats[airline]) {
        airlineStats[airline] = { count: 0, totalPrice: 0, flights: [] };
      }
      airlineStats[airline].count++;
      airlineStats[airline].totalPrice += flight.price;
      airlineStats[airline].flights.push(flight.price);
    });

    const popular_airlines = Object.entries(airlineStats)
      .map(([name, stats]) => ({
        name,
        count: stats.count,
        average_price: stats.totalPrice / stats.count,
        market_share: (stats.count / totalFlights) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate price distribution
    let price_distribution: { range: string; count: number }[] = [];
    if (prices.length > 0) {
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const rangeSize = Math.max(1, Math.ceil((maxPrice - minPrice) / 5));
      
      const distribution: { [key: string]: number } = {};
      prices.forEach(price => {
        const rangeIndex = Math.floor((price - minPrice) / rangeSize);
        const rangeStart = minPrice + (rangeIndex * rangeSize);
        const rangeEnd = rangeStart + rangeSize;
        const rangeKey = `${Math.round(rangeStart)}-${Math.round(rangeEnd)}`;
        distribution[rangeKey] = (distribution[rangeKey] || 0) + 1;
      });

      price_distribution = Object.entries(distribution)
        .map(([range, count]) => ({ range, count }))
        .sort((a, b) => parseFloat(a.range.split('-')[0]) - parseFloat(b.range.split('-')[0]));
    // Ensure trend variables are always defined
    // (Already declared and set above)
    }

    return NextResponse.json({
      success: true,
      data: {
        route: `${origin} → ${destination}`,
        average_price: Math.round(average_price),
        price_trend: final_trend,
        trend_percentage: final_trend_percentage,
        cheapest_price,
        most_expensive_price,
        flight_count: validFlights.length,
        price_history,
        popular_times,
        popular_airlines,
        price_distribution: price_distribution
      }
    } as FlightTrendResponse);

  } catch (error: any) {
    console.error('[FLIGHT TRENDS API] Unexpected Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      message: 'Terjadi kesalahan server'
    } as FlightTrendResponse, { status: 500 });
  }
}