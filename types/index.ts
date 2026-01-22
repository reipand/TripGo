// app/types/index.ts

// Enums
export type UserRole = 'user' | 'admin' | 'staff' | 'super_admin';
export type TicketStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'active';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'expired' | 'refunded';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'on_hold';
export type SeatStatus = 'available' | 'booked' | 'reserved' | 'maintenance';
export type TrainClass = 'economy' | 'business' | 'executive' | 'first' | 'ekonomi' | 'bisnis' | 'eksekutif' | string;
export type StationType = 'main' | 'transit' | 'terminal' | 'junction';
export type ScheduleStatus = 'scheduled' | 'departed' | 'arrived' | 'cancelled' | 'delayed';
export type NotificationType = 'booking' | 'payment' | 'reminder' | 'promo' | 'system';
export type PointsType = 'earn' | 'redeem' | 'expire' | 'bonus' | 'adjustment';
export type PointsStatus = 'pending' | 'completed' | 'cancelled' | 'expired';
export type PromotionDiscountType = 'percentage' | 'fixed' | 'free_shipping';

// User related interfaces
export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  date_of_birth?: Date | string;
  gender?: string;
  address?: string;
  email_verified: boolean;
  phone_verified: boolean;
  last_login?: Date | string;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: Date | string;
  updated_at: Date | string;
  trip_points?: TripPoints;
}

export interface TripPoints {
  id: string;
  user_id: string;
  total_points: number;
  available_points: number;
  spent_points: number;
  level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  last_earned_at?: Date | string;
  next_reset_date?: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  booking_id?: string;
  points: number;
  type: PointsType;
  description: string;
  status: PointsStatus;
  expires_at?: Date | string;
  metadata?: Record<string, any>;
  created_at: Date | string;
}

// Station/Terminal interfaces
export interface Station {
  id: string;
  code: string;
  name: string;
  city: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  type: StationType;
  tipe?: string;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface Terminal {
  id: string;
  name: string;
  gates: string[];
  facilities: string[];
  station_id?: string;
}

// Train related interfaces
export interface Train {
  id: string;
  kode_kereta: string;
  nama_kereta: string;
  operator: string;
  is_active: boolean;
  tipe_kereta?: string;
  jumlah_kursi?: number;
  fasilitas?: Record<string, any>;
  keterangan?: string;
  created_at: Date | string;
  updated_at: Date | string;
  
  // For frontend compatibility
  trainNumber: string;
  trainName?: string;
  originStation?: string;
  destinationStation?: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  harga: number;
  price: number;
  class: TrainClass;
  wagons?: Wagon[];
  seats?: Seat[];
}

export interface Wagon {
  id: string;
  train_id: string;
  coach_code: string;
  class_type: TrainClass;
  total_seats: number;
  layout?: Record<string, any>;
  created_at: Date | string;
  updated_at: Date | string;
  
  // For frontend compatibility
  number: string;
  name: string;
  class: TrainClass;
  facilities: string[];
  availableSeats: number;
  totalSeats: number;
  seats?: Seat[];
}

export interface Seat {
  id: string;
  id_rute?: string;
  id_gerbong?: string;
  pemesanan_id?: string;
  kode_kursi: string;
  from_stop_urutan?: number;
  to_stop_urutan?: number;
  status: SeatStatus;
  created_at: Date | string;
  updated_at: Date | string;
  
  // For frontend compatibility
  row: number;
  column: string;
  class: TrainClass;
  price: number;
  available: boolean;
  features: string[];
  windowSeat?: boolean;
  forwardFacing?: boolean;
  emergencyExit?: boolean;
  extraLegroom?: boolean;
}

export interface TrainSeat {
  id: string;
  schedule_id: string;
  coach_id: string;
  seat_number: string;
  from_route_id?: string;
  to_route_id?: string;
  status: SeatStatus;
  booking_id?: string;
  departure_route_order?: number;
  arrival_route_order?: number;
  created_at: Date | string;
  updated_at: Date | string;
}

// Schedule interfaces
export interface Schedule {
  id: string;
  kode_jadwal: string;
  kereta_id: string;
  rute_id?: string;
  tanggal: Date | string;
  jam_keberangkatan: string;
  jam_tiba: string;
  status: ScheduleStatus;
  created_at: Date | string;
  updated_at: Date | string;
  
  train?: Train;
  route?: Route;
}

export interface TrainSchedule {
  id: string;
  train_id: string;
  travel_date: Date | string;
  status: ScheduleStatus;
  created_at: Date | string;
  updated_at: Date | string;
  
  train?: Train;
  routes?: TrainRoute[];
}

// Route interfaces
export interface Route {
  id: string;
  jadwal_id?: string;
  stasiun_asal_id: string;
  stasiun_tujuan_id: string;
  waktu_keberangkatan: string;
  waktu_tiba: string;
  durasi?: number;
  next_rute_id?: string;
  created_at: Date | string;
  updated_at: Date | string;
  
  origin_station?: Station;
  destination_station?: Station;
}

export interface TrainRoute {
  id: string;
  schedule_id: string;
  origin_station_id: string;
  destination_station_id: string;
  route_order: number;
  arrival_time: string;
  departure_time: string;
  duration_minutes: number;
  train_id?: string;
  station_order: number;
  created_at: Date | string;
  updated_at: Date | string;
  
  origin_station?: Station;
  destination_station?: Station;
  train?: Train;
}

// Booking interfaces
export interface Booking {
  id: string;
  user_id?: string;
  schedule_id?: string;
  booking_code: string;
  total_amount: number;
  status: BookingStatus;
  booking_date: Date | string;
  passenger_count: number;
  payment_status: PaymentStatus;
  payment_method?: string;
  order_id?: string;
  
  // Train details
  train_code?: string;
  train_name?: string;
  train_type?: string;
  
  // Route details
  origin: string;
  destination: string;
  departure_date: Date | string;
  departure_time: string;
  arrival_time?: string;
  
  // Passenger details
  passenger_name: string;
  passenger_email: string;
  passenger_phone: string;
  passenger_details?: string;
  
  // Transit support
  transit_route_id?: string;
  transit_details?: Record<string, any>;
  transit_segments?: Record<string, any>[];
  transit_stations?: Record<string, any>[];
  transit_total_adjustment?: number;
  transit_discount?: number;
  
  // Timestamps
  created_at: Date | string;
  updated_at: Date | string;
  payment_date?: Date | string;
  
  // Additional fields for frontend
  departure?: Station;
  arrival?: Station;
  wagons?: Wagon[];
}

export interface BookingDetail {
  id: string;
  id_jadwal: string;
  pemesanan_id: string;
  nama_penumpang: string;
  kode_kereta?: string;
  seat_id?: string;
  status: TicketStatus;
  harga: number;
  created_at: Date | string;
  updated_at: Date | string;
  
  schedule?: Schedule;
  booking?: Booking;
  seat?: Seat;
}

export interface Passenger {
  id: string;
  nama: string;
  nik?: string;
  tanggal_lahir?: Date | string;
  gender?: string;
  email?: string;
  phone?: string;
  passenger_order?: number;
  booking_id?: string;
  created_at: Date | string;
  updated_at: Date | string;
}

// Payment interfaces
export interface Payment {
  id: string;
  id_pemesanan?: string;
  jumlah: number;
  status: PaymentStatus;
  payment_type?: string;
  va_number?: string;
  transaction_id?: string;
  fraud_status?: string;
  signature_key?: string;
  paid_at?: Date | string;
  rejected_at?: Date | string;
  catatan?: string;
  created_at: Date | string;
  updated_at: Date | string;
  
  booking?: Booking;
}

export interface PaymentTransaction {
  id: string;
  order_id: string;
  customer_email: string;
  customer_name?: string;
  amount: number;
  payment_method: string;
  status: PaymentStatus;
  payment_url?: string;
  midtrans_token?: string;
  transaction_data?: Record<string, any>;
  metadata?: Record<string, any>;
  snap_redirect_url?: string;
  payment_data?: Record<string, any>;
  settlement_time?: Date | string;
  payment_type?: string;
  transaction_id?: string;
  fare_breakdown?: Record<string, any>;
  booking_id?: string;
  created_at: Date | string;
  updated_at: Date | string;
  
  booking?: Booking;
}

// Ticket interfaces
export interface Ticket {
  id: string;
  booking_id: string;
  ticket_number: string;
  qr_code?: string;
  status: TicketStatus;
  passenger_name?: string;
  passenger_email?: string;
  train_name?: string;
  departure_date: Date | string;
  departure_time: string;
  arrival_time?: string;
  origin: string;
  destination: string;
  seat_number?: string;
  coach_number?: string;
  created_at: Date | string;
  updated_at: Date | string;
  
  // For frontend compatibility
  ticket_class?: string;
  price?: number;
  gate?: string;
  booking_reference?: string;
  email_sent?: boolean;
  email_sent_at?: string;
  last_email_status?: string;
  email_message_id?: string;
}

// Notification interfaces
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  data?: Record<string, any>;
  booking_id?: string;
  booking_code?: string;
  created_at: Date | string;
  updated_at: Date | string;
}

// Promotion interfaces
export interface Promotion {
  id: string;
  name: string;
  description?: string;
  promo_code: string;
  discount_type: PromotionDiscountType;
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  start_date: Date | string;
  end_date: Date | string;
  usage_limit?: number;
  usage_count: number;
  user_limit: number;
  is_active: boolean;
  applicable_to?: Record<string, any>;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface UserPromotionUsage {
  id: string;
  user_id?: string;
  promotion_id: string;
  booking_id?: string;
  usage_date: Date | string;
  discount_applied: number;
}

export interface UserPromotion {
  id: string;
  user_id?: string;
  promotion_id?: string;
  usage_count: number;
  created_at: Date | string;
  updated_at: Date | string;
}

// Transit interfaces
export interface TransitRoute {
  id: string;
  route_code: string;
  route_name: string;
  description?: string;
  base_price: number;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  
  segments?: TransitSegment[];
  stations?: TransitStation[];
  rules?: TransitRule[];
  pricing?: TransitPricing[];
}

export interface TransitSegment {
  id: string;
  transit_route_id: string;
  segment_order: number;
  train_id?: string;
  train_schedule_id?: string;
  origin_station_id: string;
  destination_station_id: string;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  waiting_minutes: number;
  price_adjustment: number;
  available_seats: number;
  created_at: Date | string;
  updated_at: Date | string;
  
  origin_station?: Station;
  destination_station?: Station;
  train?: Train;
  train_schedule?: TrainSchedule;
}

export interface TransitStation {
  id: string;
  station_id: string;
  transit_route_id: string;
  segment_id?: string;
  stop_order: number;
  is_mandatory_transit: boolean;
  min_waiting_minutes: number;
  max_waiting_minutes: number;
  available_for_booking: boolean;
  transit_fee: number;
  created_at: Date | string;
  updated_at: Date | string;
  
  station?: Station;
  segment?: TransitSegment;
}

export interface TransitSeat {
  id: string;
  booking_id: string;
  transit_segment_id: string;
  seat_id?: string;
  seat_number: string;
  coach_number?: string;
  passenger_name?: string;
  from_station_id: string;
  to_station_id: string;
  price_adjustment: number;
  status: 'reserved' | 'confirmed' | 'cancelled';
  created_at: Date | string;
  updated_at: Date | string;
  
  booking?: Booking;
  segment?: TransitSegment;
  seat?: TrainSeat;
  from_station?: Station;
  to_station?: Station;
}

export interface TransitRule {
  id: string;
  transit_route_id: string;
  rule_type: 'booking_window' | 'cancellation' | 'luggage' | 'transfer' | 'other';
  rule_name: string;
  rule_description?: string;
  rule_value?: Record<string, any>;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface TransitPricing {
  id: string;
  transit_route_id: string;
  segment_id?: string;
  day_of_week?: number;
  time_slot_start?: string;
  time_slot_end?: string;
  price_multiplier: number;
  is_active: boolean;
  start_date?: Date | string;
  end_date?: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface TransitBookingHistory {
  id: string;
  booking_id: string;
  transit_route_id: string;
  action: 'booked' | 'modified' | 'cancelled' | 'confirmed';
  details?: Record<string, any>;
  performed_by?: string;
  performed_at: Date | string;
  
  booking?: Booking;
  transit_route?: TransitRoute;
}

// Activity log interface
export interface ActivityLog {
  id: string;
  action: string;
  data?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: Date | string;
}

// Email and PDF result interfaces
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  code?: string;
  message?: string;
}

export interface PDFGenerationResult {
  success: boolean;
  buffer?: Buffer;
  error?: string;
}

// Midtrans/Snap interface
interface Window {
  snap: {
    pay: (
      token: string,
      options: {
        onSuccess?: (result: any) => void;
        onPending?: (result: any) => void;
        onError?: (result: any) => void;
        onClose?: () => void;
      }
    ) => void;
  };  
}

// Utility types
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// Class type mapping
export interface ClassType {
  id: string;
  nama_kelas: string;
  created_at: Date | string;
  updated_at: Date | string;
}