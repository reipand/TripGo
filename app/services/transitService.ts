import { supabase } from '@/app/lib/supabaseClient';

export interface RouteSegment {
  id: string;
  station_code: string;
  station_name: string;
  departure_time: string;
  arrival_time: string;
  route_order: number;
}

export interface SeatAvailabilityRequest {
  scheduleId: string;
  departureStationCode: string;
  arrivalStationCode: string;
  travelDate: string;
  seatClass?: string;
}

export interface AvailableSeat {
  seat_id: string;
  coach_number: string;
  seat_number: string;
  seat_class: string;
  price: number;
  is_available: boolean;
  segment_availability: boolean;
}

export class TransitService {
  // Get route segments untuk schedule tertentu
  static async getRouteSegments(scheduleId: string): Promise<RouteSegment[]> {
    const { data, error } = await supabase
      .from('rute_kereta')
      .select(`
        id,
        route_order,
        departure_time,
        arrival_time,
        stasiun:origin_station_id (
          code,
          name
        )
      `)
      .eq('schedule_id', scheduleId)
      .order('route_order', { ascending: true });

    if (error) throw error;

    return data.map(route => ({
      id: route.id,
      station_code: route.stasiun.code,
      station_name: route.stasiun.name,
      departure_time: route.departure_time,
      arrival_time: route.arrival_time,
      route_order: route.route_order
    }));
  }

  // Get station order number
  static async getStationOrder(
    scheduleId: string, 
    stationCode: string
  ): Promise<number | null> {
    const { data, error } = await supabase
      .from('rute_kereta')
      .select('route_order')
      .eq('schedule_id', scheduleId)
      .eq('stasiun.code', stationCode)
      .single();

    if (error || !data) return null;
    return data.route_order;
  }

  // Check seat availability untuk segment tertentu
  static async checkSeatAvailability(
    scheduleId: string,
    seatId: string,
    departureOrder: number,
    arrivalOrder: number
  ): Promise<boolean> {
    // Cek apakah ada booking untuk segment ini
    const { data: existingBookings, error } = await supabase
      .from('seat_availability')
      .select('id, is_available')
      .eq('train_seat_id', seatId)
      .eq('schedule_id', scheduleId)
      .eq('is_available', false)
      .or(`and(departure_route_order.lte.${arrivalOrder},arrival_route_order.gt.${departureOrder})`);

    if (error) throw error;

    // Jika ada booking yang overlap, kursi tidak tersedia
    return existingBookings.length === 0;
  }

  // Get all available seats for a segment
  static async getAvailableSeats(
    request: SeatAvailabilityRequest
  ): Promise<AvailableSeat[]> {
    // 1. Get station orders
    const departureOrder = await this.getStationOrder(
      request.scheduleId, 
      request.departureStationCode
    );
    const arrivalOrder = await this.getStationOrder(
      request.scheduleId, 
      request.arrivalStationCode
    );

    if (!departureOrder || !arrivalOrder) {
      throw new Error('Stasiun tidak valid untuk rute ini');
    }

    // 2. Get all seats for this schedule
    const { data: allSeats, error: seatsError } = await supabase
      .from('train_seats')
      .select(`
        id,
        seat_number,
        gerbong:coach_id (
          coach_code,
          class_type
        ),
        schedule:schedule_id (
          jadwal_kereta!inner (
            travel_date,
            kereta:train_id (
              code,
              name
            )
          )
        )
      `)
      .eq('schedule_id', request.scheduleId)
      .eq('status', 'available');

    if (seatsError) throw seatsError;
    if (!allSeats || allSeats.length === 0) return [];

    // 3. Check availability for each seat
    const availableSeats: AvailableSeat[] = [];

    for (const seat of allSeats) {
      const isAvailable = await this.checkSeatAvailability(
        request.scheduleId,
        seat.id,
        departureOrder,
        arrivalOrder
      );

      // Filter by class jika diperlukan
      if (request.seatClass && seat.gerbong.class_type !== request.seatClass) {
        continue;
      }

      // Calculate price based on segment
      const price = await this.calculateSegmentPrice(
        request.scheduleId,
        departureOrder,
        arrivalOrder,
        seat.gerbong.class_type
      );

      availableSeats.push({
        seat_id: seat.id,
        coach_number: seat.gerbong.coach_code,
        seat_number: seat.seat_number,
        seat_class: seat.gerbong.class_type,
        price,
        is_available: isAvailable,
        segment_availability: isAvailable
      });
    }

    return availableSeats;
  }

  // Book seat untuk segment tertentu
  static async bookSeatSegment(
    bookingId: string,
    scheduleId: string,
    seatId: string,
    departureOrder: number,
    arrivalOrder: number,
    departureStationCode: string,
    arrivalStationCode: string
  ): Promise<boolean> {
    try {
      // Mulai transaction
      const { data: seatData, error: seatError } = await supabase
        .from('train_seats')
        .select('status')
        .eq('id', seatId)
        .single();

      if (seatError || seatData.status !== 'available') {
        throw new Error('Kursi tidak tersedia');
      }

      // Cek availability lagi (double-check)
      const isAvailable = await this.checkSeatAvailability(
        scheduleId,
        seatId,
        departureOrder,
        arrivalOrder
      );

      if (!isAvailable) {
        throw new Error('Kursi sudah dipesan untuk segmen ini');
      }

      // Create seat availability record
      const { error: availabilityError } = await supabase
        .from('seat_availability')
        .insert({
          train_seat_id: seatId,
          schedule_id: scheduleId,
          departure_route_order: departureOrder,
          arrival_route_order: arrivalOrder,
          departure_station_code: departureStationCode,
          arrival_station_code: arrivalStationCode,
          is_available: false,
          booking_id: bookingId
        });

      if (availabilityError) throw availabilityError;

      // Update seat status jika semua segment sudah terbooking
      await this.updateSeatStatusIfFullyBooked(seatId, scheduleId);

      return true;
    } catch (error) {
      console.error('Error booking seat segment:', error);
      throw error;
    }
  }

  // Update seat status jika semua segment sudah terbooking
  private static async updateSeatStatusIfFullyBooked(
    seatId: string,
    scheduleId: string
  ): Promise<void> {
    // Get total route segments
    const { data: routeSegments, error: routeError } = await supabase
      .from('rute_kereta')
      .select('route_order')
      .eq('schedule_id', scheduleId)
      .order('route_order', { ascending: true });

    if (routeError || !routeSegments) return;

    const totalSegments = routeSegments.length - 1; // Dari order 0 ke n-1
    const segmentPairs: [number, number][] = [];

    // Generate semua kemungkinan segment
    for (let i = 0; i < totalSegments; i++) {
      for (let j = i + 1; j <= totalSegments; j++) {
        segmentPairs.push([i, j]);
      }
    }

    // Cek semua segment sudah terbooking
    let allBooked = true;

    for (const [departureOrder, arrivalOrder] of segmentPairs) {
      const isAvailable = await this.checkSeatAvailability(
        scheduleId,
        seatId,
        departureOrder,
        arrivalOrder
      );

      if (isAvailable) {
        allBooked = false;
        break;
      }
    }

    // Update seat status jika semua segment terbooking
    if (allBooked) {
      await supabase
        .from('train_seats')
        .update({ status: 'booked' })
        .eq('id', seatId);
    }
  }

  // Calculate price berdasarkan segment
  private static async calculateSegmentPrice(
    scheduleId: string,
    departureOrder: number,
    arrivalOrder: number,
    seatClass: string
  ): Promise<number> {
    // Base price per kilometer
    const basePrices = {
      'Eksekutif': 5000,
      'Bisnis': 3000,
      'Ekonomi': 1500
    };

    // Get route distances atau gunakan order difference
    const segmentLength = arrivalOrder - departureOrder;
    const basePrice = basePrices[seatClass] || basePrices['Ekonomi'];

    return basePrice * segmentLength * 100; // Contoh calculation
  }

  // Cancel seat booking untuk segment tertentu
  static async cancelSeatSegment(
    bookingId: string,
    seatId: string,
    scheduleId: string
  ): Promise<boolean> {
    try {
      // Hapus seat availability records untuk booking ini
      const { error: deleteError } = await supabase
        .from('seat_availability')
        .delete()
        .eq('booking_id', bookingId)
        .eq('train_seat_id', seatId)
        .eq('schedule_id', scheduleId);

      if (deleteError) throw deleteError;

      // Update seat status kembali ke available
      await supabase
        .from('train_seats')
        .update({ status: 'available' })
        .eq('id', seatId);

      return true;
    } catch (error) {
      console.error('Error canceling seat segment:', error);
      throw error;
    }
  }

  // Get seat availability status untuk display
  static async getSeatAvailabilityMap(
    scheduleId: string
  ): Promise<Map<string, boolean[][]>> {
    const seatMap = new Map<string, boolean[][]>();

    // Get all seats
    const { data: seats, error } = await supabase
      .from('train_seats')
      .select(`
        id,
        seat_number,
        gerbong:coach_id (
          coach_code
        )
      `)
      .eq('schedule_id', scheduleId);

    if (error || !seats) return seatMap;

    // Get route segments
    const routeSegments = await this.getRouteSegments(scheduleId);
    const totalSegments = routeSegments.length - 1;

    // Untuk setiap seat, buat availability matrix
    for (const seat of seats) {
      const availabilityMatrix: boolean[][] = [];

      for (let i = 0; i < totalSegments; i++) {
        availabilityMatrix[i] = [];
        for (let j = i + 1; j <= totalSegments; j++) {
          const isAvailable = await this.checkSeatAvailability(
            scheduleId,
            seat.id,
            i,
            j
          );
          availabilityMatrix[i][j] = isAvailable;
        }
      }

      const seatKey = `${seat.gerbong.coach_code}-${seat.seat_number}`;
      seatMap.set(seatKey, availabilityMatrix);
    }

    return seatMap;
  }
}