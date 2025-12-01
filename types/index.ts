export interface Seat {
  id: string;
  row: number;
  column: string;
  class: 'economy' | 'business' | 'first';
  price: number;
  available: boolean;
  features: string[];
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

export interface Train {
  id: string;
  trainNumber: string;
  departure: Station;
  arrival: Station;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  price: number;
  seats: Seat[];
  class: 'ekonomi' | 'bisnis' | 'eksekutif';
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