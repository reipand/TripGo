export interface Seat {
  id: string;
  row: number;
  column: string; // e.g., 'A', 'B', 'C', 'D', 'E'
  class: 'economy' | 'business' | 'executive' | 'first';
  price: number;
  available: boolean;
  features: string[];
  windowSeat?: boolean;
  forwardFacing?: boolean;
  emergencyExit?: boolean;
  extraLegroom?: boolean;
}

export interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  departure: Airport;
  arrival: Airport;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  price: number;
  seats: Seat[];
  aircraft: Aircraft;
}

export interface Wagon {
  number: string;
  name: string;
  class: 'economy' | 'business' | 'executive' | string;
  facilities: string[];
  availableSeats: number;
  totalSeats: number;
  seats: Seat[];
}

export interface Train {
  [x: string]: any;
  harga: number;
  id: string;
  trainNumber: string;
  trainName?: string;
  operator?: string;
  originStation?: string;
  destinationStation?: string;
  departure: Station;
  arrival: Station;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  price: number;
  wagons: Wagon[];
  seats: Seat[];
  class: 'economy' | 'business' | 'executive' | 'ekonomi' | 'bisnis' | 'eksekutif';
}
export interface Ticket {
  id: string;
  ticket_number: string;
  passenger_name: string;
  passenger_email: string;
  departure_location: string;
  destination_location: string;
  departure_date: string | Date;
  arrival_date: string | Date;
  flight_number: string;
  seat_number: string;
  gate: string;
  booking_reference?: string;
  ticket_class?: string;
  price?: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  qr_code_url?: string;
  email_sent?: boolean;
  email_sent_at?: string;
  last_email_status?: string;
  email_message_id?: string;
  created_at?: string;
  updated_at?: string;
}

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

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  terminals: Terminal[];
}

export interface Station {
  code: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface Terminal {
  id: string;
  name: string;
  gates: string[];
  facilities: string[];
}

export interface Aircraft {
  model: string;
  capacity: number;
  layout: SeatLayout;
}

export interface SeatLayout {
  rows: number;
  columns: string[];
  businessClassRows: number[];
  firstClassRows: number[];
  emergencyExits: number[];
}