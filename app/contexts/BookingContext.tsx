'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Train, Seat } from '@/types';

interface BookingState {
  selectedTrain: Train | null;
  selectedSeats: Seat[];
  passengerCount: number;
  totalPrice: number;
  bookingStep: number;
}

type BookingAction = 
  | { type: 'SELECT_TRAIN'; payload: Train }
  | { type: 'SELECT_SEAT'; payload: Seat }
  | { type: 'REMOVE_SEAT'; payload: string }
  | { type: 'SET_PASSENGER_COUNT'; payload: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'RESET_BOOKING' };

const initialState: BookingState = {
  selectedTrain: null,
  selectedSeats: [],
  passengerCount: 1,
  totalPrice: 0,
  bookingStep: 1,
};

const bookingReducer = (state: BookingState, action: BookingAction): BookingState => {
  switch (action.type) {
    case 'SELECT_TRAIN':
      return {
        ...state,
        selectedTrain: action.payload,
        selectedSeats: [],
        bookingStep: 2,
      };

    case 'SELECT_SEAT':
      const seatAlreadySelected = state.selectedSeats.some(seat => seat.id === action.payload.id);
      if (seatAlreadySelected || state.selectedSeats.length >= state.passengerCount) {
        return state;
      }
      return {
        ...state,
        selectedSeats: [...state.selectedSeats, action.payload],
        totalPrice: state.totalPrice + action.payload.price,
      };

    case 'REMOVE_SEAT':
      const seatToRemove = state.selectedSeats.find(seat => seat.id === action.payload);
      return {
        ...state,
        selectedSeats: state.selectedSeats.filter(seat => seat.id !== action.payload),
        totalPrice: seatToRemove ? state.totalPrice - seatToRemove.price : state.totalPrice,
      };

    case 'SET_PASSENGER_COUNT':
      return {
        ...state,
        passengerCount: action.payload,
        selectedSeats: state.selectedSeats.slice(0, action.payload),
      };

    case 'NEXT_STEP':
      return { ...state, bookingStep: state.bookingStep + 1 };

    case 'PREVIOUS_STEP':
      return { ...state, bookingStep: state.bookingStep - 1 };

    case 'RESET_BOOKING':
      return initialState;

    default:
      return state;
  }
};

const BookingContext = createContext<{
  state: BookingState;
  dispatch: React.Dispatch<BookingAction>;
} | null>(null);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(bookingReducer, initialState);

  return (
    <BookingContext.Provider value={{ state, dispatch }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};