// app/types/index.ts

// Enums
export type UserRole = 'user' | 'admin' | 'staff' | 'super_admin';
export type TicketStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'active' | 'used' | 'expired';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'expired' | 'refunded' | 'partial_refund' | 'cancelled';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'on_hold' | 'waiting_payment' | 'processing';
export type SeatStatus = 'available' | 'booked' | 'reserved' | 'maintenance' | 'blocked' | 'selected';
export type TrainClass = 'economy' | 'business' | 'executive' | 'first' | 'ekonomi' | 'bisnis' | 'eksekutif' | 'premium' | 'luxury' | string;
export type StationType = 'main' | 'transit' | 'terminal' | 'junction' | 'interchange';
export type ScheduleStatus = 'scheduled' | 'departed' | 'arrived' | 'cancelled' | 'delayed' | 'boarding' | 'on_time';
export type NotificationType = 'booking' | 'payment' | 'reminder' | 'promo' | 'system' | 'announcement' | 'schedule_change';
export type PointsType = 'earn' | 'redeem' | 'expire' | 'bonus' | 'adjustment' | 'refund';
export type PointsStatus = 'pending' | 'completed' | 'cancelled' | 'expired' | 'processing';
export type PromotionDiscountType = 'percentage' | 'fixed' | 'free_shipping' | 'buy_one_get_one' | 'combo';
export type GenderType = 'male' | 'female' | 'other';
export type IDType = 'ktp' | 'passport' | 'sim' | 'student_id';
export type SegmentStatus = 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
export type LuggageType = 'hand_carry' | 'checked' | 'oversize';
export type MealPreference = 'regular' | 'vegetarian' | 'halal' | 'special' | 'none';

// User related interfaces
export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  date_of_birth?: Date | string;
  gender?: GenderType;
  address?: string;
  email_verified: boolean;
  phone_verified: boolean;
  last_login?: Date | string;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: Date | string;
  updated_at: Date | string;
  trip_points?: TripPoints;
  preferences?: UserPreferences;
  documents?: UserDocument[];
}

export interface UserPreferences {
  id: string;
  user_id: string;
  language: string;
  currency: string;
  timezone: string;
  notification_email: boolean;
  notification_sms: boolean;
  notification_push: boolean;
  seat_preference?: 'window' | 'aisle' | 'middle' | 'front' | 'back';
  meal_preference?: MealPreference;
  special_assistance?: boolean;
  newsletter_subscribed: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface UserDocument {
  id: string;
  user_id: string;
  document_type: IDType;
  document_number: string;
  document_file_url?: string;
  verified: boolean;
  verified_at?: Date | string;
  expiry_date?: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
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
  level_benefits?: Record<string, any>;
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
  transaction_reference?: string;
}

// Station/Terminal interfaces
export interface Station {
  id: string;
  kode_stasiun: string;
  nama_stasiun: string;
  city: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  type: StationType;
  tipe?: string;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  facilities?: string[];
  timezone?: string;
  contact_number?: string;
  address?: string;
  platform_count?: number;
  photo_url?: string;
}

export interface Terminal {
  id: string;
  name: string;
  gates: string[];
  facilities: string[];
  station_id?: string;
  operating_hours?: {
    open: string;
    close: string;
  };
  services?: string[];
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
  
  // Additional fields
  manufacturer?: string;
  year_built?: number;
  max_speed?: number;
  train_length?: number;
  power_type?: string;
  maintenance_due?: Date | string;
  last_maintenance?: Date | string;
  insurance_valid_until?: Date | string;
  
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
  schedules?: TrainSchedule[];
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
  
  // Additional fields
  wagon_number: string;
  manufacturer?: string;
  year_built?: number;
  capacity?: {
    seats: number;
    standing?: number;
    luggage?: number;
  };
  facilities?: string[];
  accessibility_features?: string[];
  emergency_equipment?: string[];
  
  // For frontend compatibility
  number: string;
  name: string;
  class: TrainClass;
  facilities: string[];
  availableSeats: number;
  totalSeats: number;
  seats?: Seat[];
  seat_map?: SeatMapLayout;
}

export interface SeatMapLayout {
  rows: number;
  columns: number;
  arrangement: string[][];
  aisle_positions: number[];
  emergency_exits: number[];
  wheelchair_positions: number[];
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
  
  // Additional fields
  wagon_id?: string;
  seat_type?: 'regular' | 'premium' | 'business' | 'first';
  features: string[];
  price_multiplier: number;
  booking_id?: string;
  booking_expiry?: Date | string;
  
  // For frontend compatibility
  row: number;
  column: string;
  class: TrainClass;
  price: number;
  available: boolean;
  windowSeat?: boolean;
  forwardFacing?: boolean;
  emergencyExit?: boolean;
  extraLegroom?: boolean;
  powerOutlet?: boolean;
  trayTable?: boolean;
  recline?: boolean;
  width?: number;
  pitch?: number;
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
  
  // Additional fields
  price_adjustment?: number;
  booking_expiry?: Date | string;
  reserved_by?: string;
  features?: string[];
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
  
  // Additional fields
  delay_minutes?: number;
  platform?: string;
  track?: string;
  estimated_departure?: string;
  estimated_arrival?: string;
  actual_departure?: string;
  actual_arrival?: string;
  operator_notes?: string;
  
  train?: Train;
  route?: Route;
  bookings?: Booking[];
  seats?: TrainSeat[];
}

export interface TrainSchedule {
  id: string;
  train_id: string;
  travel_date: Date | string;
  status: ScheduleStatus;
  created_at: Date | string;
  updated_at: Date | string;
  
  // Additional fields
  schedule_code: string;
  operating_days: number[]; // 0-6 for Sunday-Saturday
  effective_from: Date | string;
  effective_to?: Date | string;
  is_holiday_schedule: boolean;
  capacity: number;
  available_seats: number;
  base_price: number;
  
  train?: Train;
  routes?: TrainRoute[];
  bookings?: Booking[];
  transit_segments?: TransitSegment[];
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
  
  // Additional fields
  distance_km?: number;
  route_type?: 'direct' | 'transit' | 'express';
  stops?: RouteStop[];
  
  origin_station?: Station;
  destination_station?: Station;
  intermediate_stations?: Station[];
}

export interface RouteStop {
  station_id: string;
  arrival_time: string;
  departure_time: string;
  stop_duration: number;
  platform?: string;
  stop_order: number;
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
  
  // Additional fields
  distance_km?: number;
  base_fare?: number;
  available_capacity?: number;
  stop_type?: 'pickup' | 'dropoff' | 'both';
  
  origin_station?: Station;
  destination_station?: Station;
  train?: Train;
  bookings?: Booking[];
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
  train_class?: TrainClass;
  
  // Route details
  origin: string;
  destination: string;
  departure_date: Date | string;
  departure_time: string;
  arrival_time?: string;
  duration_minutes?: number;
  
  // Passenger details
  passenger_name: string;
  passenger_email: string;
  passenger_phone: string;
  passenger_details?: string;
  emergency_contact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  
  // Luggage information
  luggage_count?: number;
  luggage_details?: LuggageDetail[];
  
  // Special requests
  special_requests?: string;
  meal_preference?: MealPreference;
  assistance_required?: boolean;
  
  // Transit support
  transit_route_id?: string;
  transit_details?: Record<string, any>;
  transit_segments?: TransitSegmentBooking[];
  transit_stations?: TransitStationBooking[];
  transit_total_adjustment?: number;
  transit_discount?: number;
  transit_status?: SegmentStatus;
  
  // Payment details
  payment_id?: string;
  payment_gateway?: string;
  payment_reference?: string;
  refund_amount?: number;
  refund_reason?: string;
  
  // Audit fields
  created_by?: string;
  modified_by?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
  cancellation_fee?: number;
  
  // Timestamps
  created_at: Date | string;
  updated_at: Date | string;
  payment_date?: Date | string;
  confirmed_at?: Date | string;
  cancelled_at?: Date | string;
  completed_at?: Date | string;
  
  // Additional fields for frontend
  departure?: Station;
  arrival?: Station;
  wagons?: Wagon[];
  seats?: TrainSeat[];
  passengers?: Passenger[];
  payment_transaction?: PaymentTransaction;
  tickets?: Ticket[];
  notifications?: Notification[];
}

export interface TransitSegmentBooking {
  segment_id: string;
  train_schedule_id: string;
  origin_station_id: string;
  destination_station_id: string;
  departure_time: string;
  arrival_time: string;
  seat_ids: string[];
  seat_numbers: string[];
  wagon_numbers: string[];
  status: SegmentStatus;
  boarding_pass_issued: boolean;
  checked_in: boolean;
  checked_in_at?: Date | string;
}

export interface TransitStationBooking {
  station_id: string;
  arrival_time: string;
  departure_time: string;
  waiting_minutes: number;
  platform?: string;
  gate?: string;
  status: 'pending' | 'arrived' | 'departed' | 'missed';
}

export interface LuggageDetail {
  type: LuggageType;
  count: number;
  weight_kg?: number;
  dimensions?: string;
  special_handling?: boolean;
  tracking_number?: string;
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
  
  // Additional fields
  seat_number?: string;
  wagon_number?: string;
  boarding_time?: string;
  gate?: string;
  ticket_number?: string;
  check_in_status?: 'not_checked' | 'checked' | 'boarded';
  check_in_time?: Date | string;
  
  schedule?: Schedule;
  booking?: Booking;
  seat?: Seat;
  passenger?: Passenger;
}

export interface Passenger {
  id: string;
  nama: string;
  nik?: string;
  tanggal_lahir?: Date | string;
  gender?: GenderType;
  email?: string;
  phone?: string;
  passenger_order?: number;
  booking_id?: string;
  created_at: Date | string;
  updated_at: Date | string;
  
  // Additional fields
  title?: string;
  nationality?: string;
  passport_number?: string;
  passport_expiry?: Date | string;
  frequent_traveler_number?: string;
  special_assistance?: boolean;
  meal_preference?: MealPreference;
  seat_preference?: string;
  
  // Contact information
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  
  // Booking relation
  booking?: Booking;
  ticket?: Ticket;
  seat_assignment?: SeatAssignment;
}

export interface SeatAssignment {
  id: string;
  passenger_id: string;
  seat_id: string;
  booking_id: string;
  segment_id?: string;
  seat_number: string;
  wagon_number: string;
  class: TrainClass;
  assignment_status: 'confirmed' | 'pending' | 'changed' | 'cancelled';
  assigned_at: Date | string;
  changed_at?: Date | string;
  notes?: string;
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
  
  // Additional fields
  payment_gateway?: string;
  payment_channel?: string;
  currency?: string;
  exchange_rate?: number;
  fees?: number;
  tax?: number;
  net_amount?: number;
  refund_amount?: number;
  refund_reason?: string;
  metadata?: Record<string, any>;
  
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
  
  // Additional fields
  bank_code?: string;
  va_number?: string;
  bill_key?: string;
  biller_code?: string;
  ewallet_type?: string;
  qr_code?: string;
  expiry_time?: Date | string;
  retry_count?: number;
  last_retry_at?: Date | string;
  error_message?: string;
  
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
  
  // Additional fields
  passenger_id?: string;
  segment_id?: string;
  ticket_class?: string;
  price?: number;
  gate?: string;
  platform?: string;
  boarding_time?: string;
  booking_reference?: string;
  pnr_number?: string;
  issuing_date?: Date | string;
  valid_until?: Date | string;
  restrictions?: string;
  baggage_allowance?: string;
  terms_conditions?: string;
  
  // Email notification
  email_sent?: boolean;
  email_sent_at?: string;
  last_email_status?: string;
  email_message_id?: string;
  sms_sent?: boolean;
  sms_sent_at?: string;
  
  // Check-in information
  checked_in?: boolean;
  checked_in_at?: Date | string;
  boarding_pass_issued?: boolean;
  boarding_pass_url?: string;
  
  // For frontend compatibility
  departure_station?: Station;
  arrival_station?: Station;
  booking?: Booking;
  passenger?: Passenger;
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
  
  // Additional fields
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  channel?: 'email' | 'sms' | 'push' | 'in_app';
  sent_at?: Date | string;
  read_at?: Date | string;
  action_url?: string;
  action_text?: string;
  metadata?: Record<string, any>;
  
  user?: User;
  booking?: Booking;
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
  
  // Additional fields
  promotion_type?: 'public' | 'private' | 'targeted' | 'flash';
  target_audience?: {
    user_levels?: string[];
    user_ids?: string[];
    segments?: string[];
  };
  conditions?: {
    train_classes?: TrainClass[];
    routes?: string[];
    time_of_day?: {
      start: string;
      end: string;
    };
    days_of_week?: number[];
    booking_window?: {
      min_days: number;
      max_days: number;
    };
  };
  display_settings?: {
    banner_image?: string;
    color_scheme?: string;
    display_priority?: number;
  };
  metadata?: Record<string, any>;
}

export interface UserPromotionUsage {
  id: string;
  user_id?: string;
  promotion_id: string;
  booking_id?: string;
  usage_date: Date | string;
  discount_applied: number;
  
  // Additional fields
  order_amount?: number;
  original_discount?: number;
  capped_discount?: number;
  promotion_conditions_met?: boolean;
  usage_ip?: string;
  user_agent?: string;
  
  promotion?: Promotion;
  user?: User;
  booking?: Booking;
}

export interface UserPromotion {
  id: string;
  user_id?: string;
  promotion_id?: string;
  usage_count: number;
  created_at: Date | string;
  updated_at: Date | string;
  
  // Additional fields
  last_used_at?: Date | string;
  total_discount_saved?: number;
  is_favorite?: boolean;
  reminder_sent?: boolean;
  
  promotion?: Promotion;
  user?: User;
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
  
  // Additional fields
  route_type?: 'domestic' | 'international' | 'intercity' | 'regional';
  total_distance_km?: number;
  estimated_total_duration?: number;
  min_transfer_time?: number;
  max_transfer_time?: number;
  operating_days?: number[];
  seasonality?: {
    peak_season_multiplier: number;
    off_season_multiplier: number;
  };
  popularity_score?: number;
  
  segments?: TransitSegment[];
  stations?: TransitStation[];
  rules?: TransitRule[];
  pricing?: TransitPricing[];
  bookings?: Booking[];
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
  
  // Additional fields
  segment_code?: string;
  train_class?: TrainClass;
  facilities?: string[];
  meal_included?: boolean;
  luggage_allowance?: {
    hand_carry: number;
    checked: number;
  };
  boarding_instructions?: string;
  transfer_type?: 'same_station' | 'different_station' | 'shuttle';
  transfer_distance_meters?: number;
  transfer_time_minutes?: number;
  
  origin_station?: Station;
  destination_station?: Station;
  train?: Train;
  train_schedule?: TrainSchedule;
  transit_seats?: TransitSeat[];
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
  
  // Additional fields
  platform?: string;
  gate?: string;
  transfer_instructions?: string;
  facilities_available?: string[];
  nearby_amenities?: string[];
  photo_url?: string;
  
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
  status: 'reserved' | 'confirmed' | 'cancelled' | 'changed';
  created_at: Date | string;
  updated_at: Date | string;
  
  // Additional fields
  passenger_id?: string;
  ticket_number?: string;
  boarding_pass_issued?: boolean;
  checked_in?: boolean;
  checked_in_at?: Date | string;
  seat_features?: string[];
  special_requests?: string;
  
  booking?: Booking;
  segment?: TransitSegment;
  seat?: TrainSeat;
  from_station?: Station;
  to_station?: Station;
  passenger?: Passenger;
}

export interface TransitRule {
  id: string;
  transit_route_id: string;
  rule_type: 'booking_window' | 'cancellation' | 'luggage' | 'transfer' | 'other' | 'check_in' | 'boarding';
  rule_name: string;
  rule_description?: string;
  rule_value?: Record<string, any>;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  
  // Additional fields
  priority?: number;
  applies_to?: string[];
  conditions?: Record<string, any>;
  exceptions?: string[];
  enforcement_level?: 'strict' | 'flexible' | 'informational';
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
  
  // Additional fields
  pricing_type?: 'base' | 'peak' | 'off_peak' | 'holiday' | 'special';
  min_passengers?: number;
  max_passengers?: number;
  advance_booking_days?: number;
  last_minute_multiplier?: number;
  group_discount?: {
    min_group_size: number;
    discount_percentage: number;
  };
}

export interface TransitBookingHistory {
  id: string;
  booking_id: string;
  transit_route_id: string;
  action: 'booked' | 'modified' | 'cancelled' | 'confirmed' | 'checked_in' | 'boarded' | 'completed';
  details?: Record<string, any>;
  performed_by?: string;
  performed_at: Date | string;
  
  // Additional fields
  ip_address?: string;
  user_agent?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    city?: string;
  };
  notes?: string;
  system_notes?: string;
  
  booking?: Booking;
  transit_route?: TransitRoute;
  user?: User;
}

// Activity log interface
export interface ActivityLog {
  id: string;
  action: string;
  data?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: Date | string;
  
  // Additional fields
  user_id?: string;
  entity_type?: string;
  entity_id?: string;
  action_type?: 'create' | 'update' | 'delete' | 'view' | 'login' | 'logout';
  status?: 'success' | 'failure' | 'warning';
  error_message?: string;
  duration_ms?: number;
  request_path?: string;
  request_method?: string;
  response_status?: number;
  
  user?: User;
}

// Email and PDF result interfaces
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  code?: string;
  message?: string;
  recipient?: string;
  subject?: string;
  sent_at?: Date | string;
  template_used?: string;
}

export interface PDFGenerationResult {
  success: boolean;
  buffer?: Buffer;
  error?: string;
  file_size?: number;
  generation_time_ms?: number;
  download_url?: string;
  filename?: string;
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
        language?: string;
        enabledPayments?: string[];
      }
    ) => void;
  };  
}

// Search and Filter interfaces
export interface SearchCriteria {
  origin: string;
  destination: string;
  departureDate: string;
  passengers: number;
  trainClass?: TrainClass[];
  departureTimeRange?: {
    start: string;
    end: string;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  facilities?: string[];
  transitOption?: 'direct' | 'transit' | 'all';
  sortBy?: 'price' | 'departure_time' | 'duration' | 'arrival_time';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  trains: TrainSchedule[];
  total_count: number;
  filters: {
    available_classes: TrainClass[];
    price_range: {
      min: number;
      max: number;
    };
    departure_times: string[];
    facilities: string[];
  };
  pagination: {
    page: number;
    limit: number;
    total_pages: number;
  };
}

// Dashboard and Analytics interfaces
export interface DashboardStats {
  total_bookings: number;
  total_revenue: number;
  active_users: number;
  pending_payments: number;
  monthly_trend: {
    month: string;
    bookings: number;
    revenue: number;
  }[];
  top_routes: {
    origin: string;
    destination: string;
    bookings: number;
    revenue: number;
  }[];
  train_occupancy: {
    train_name: string;
    occupancy_rate: number;
    available_seats: number;
  }[];
}

export interface UserDashboard {
  upcoming_trips: Booking[];
  past_trips: Booking[];
  points_summary: {
    available: number;
    expiring_soon: number;
    next_level: {
      level: string;
      points_needed: number;
    };
  };
  favorite_routes: {
    origin: string;
    destination: string;
    trip_count: number;
    last_trip: Date | string;
  }[];
  notifications: Notification[];
}

// Utility types
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  timestamp?: Date | string;
  request_id?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

// Class type mapping
export interface ClassType {
  id: string;
  nama_kelas: string;
  created_at: Date | string;
  updated_at: Date | string;
  
  // Additional fields
  description?: string;
  amenities: string[];
  seat_width?: number;
  seat_pitch?: number;
  meal_service?: boolean;
  entertainment?: boolean;
  wifi?: boolean;
  power_outlets?: boolean;
  luggage_allowance?: {
    hand_carry: number;
    checked: number;
  };
  priority_boarding?: boolean;
  lounge_access?: boolean;
  price_multiplier: number;
}

// Real-time interfaces
export interface RealTimeUpdate {
  type: 'seat_availability' | 'schedule_change' | 'price_change' | 'booking_update';
  data: any;
  timestamp: Date | string;
  entity_id: string;
  entity_type: string;
}

export interface SeatAvailabilityUpdate {
  schedule_id: string;
  wagon_id: string;
  seat_id: string;
  new_status: SeatStatus;
  booking_id?: string;
  updated_at: Date | string;
}

export interface ScheduleUpdate {
  schedule_id: string;
  field: string;
  old_value: any;
  new_value: any;
  reason?: string;
  updated_at: Date | string;
}

// Form and Validation interfaces
export interface PassengerFormData {
  title: string;
  fullName: string;
  idType: IDType;
  idNumber: string;
  birthDate: string;
  gender: GenderType;
  email: string;
  phoneNumber: string;
  nationality?: string;
  seatPreference?: string;
  mealPreference?: MealPreference;
  specialAssistance?: boolean;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface BookingFormData {
  passengers: PassengerFormData[];
  contactPerson: {
    fullName: string;
    email: string;
    phoneNumber: string;
    receiveUpdates: boolean;
  };
  paymentMethod: string;
  termsAccepted: boolean;
  promoCode?: string;
  specialRequests?: string;
  luggageDetails?: LuggageDetail[];
}

// Payment method interfaces
export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  type: 'bank_transfer' | 'ewallet' | 'credit_card' | 'virtual_account' | 'retail' | 'qris';
  description?: string;
  icon: string;
  fees: number;
  processing_time?: string;
  banks?: string[];
  minimum_amount?: number;
  maximum_amount?: number;
  is_active: boolean;
  metadata?: Record<string, any>;
}

// Cache and Performance interfaces
export interface CacheEntry<T> {
  data: T;
  expires_at: Date | string;
  created_at: Date | string;
  hits: number;
  last_accessed: Date | string;
}

export interface PerformanceMetrics {
  endpoint: string;
  response_time_ms: number;
  timestamp: Date | string;
  status_code: number;
  user_id?: string;
  cache_hit: boolean;
  database_queries: number;
  memory_usage_mb: number;
}

// Export all types
export type {
  UserRole,
  TicketStatus,
  PaymentStatus,
  BookingStatus,
  SeatStatus,
  TrainClass,
  StationType,
  ScheduleStatus,
  NotificationType,
  PointsType,
  PointsStatus,
  PromotionDiscountType,
  GenderType,
  IDType,
  SegmentStatus,
  LuggageType,
  MealPreference
};