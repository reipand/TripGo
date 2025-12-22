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