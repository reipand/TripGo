// utils/seatReuse.ts
import { Seat, SeatOccupancy } from './types';

// Fungsi untuk mengupdate occupancy data untuk seat reuse
export const updateSeatOccupancy = (
  seats: Seat[],
  segmentId: string,
  passengerIds: string[],
  selectedSeatIds: string[]
): Seat[] => {
  return seats.map(seat => {
    const isSelected = selectedSeatIds.includes(seat.id);
    
    if (isSelected) {
      // Update occupancy untuk seat yang dipilih
      const existingOccupancy = seat.occupancy || {
        seatId: seat.id,
        occupiedSegments: [],
        passengerIds: []
      };
      
      return {
        ...seat,
        occupancy: {
          ...existingOccupancy,
          occupiedSegments: [...new Set([...existingOccupancy.occupiedSegments, segmentId])],
          passengerIds: [...new Set([...existingOccupancy.passengerIds || [], ...passengerIds])]
        }
      };
    }
    
    return seat;
  });
};

// Fungsi untuk membersihkan occupancy untuk segment tertentu
export const clearSegmentOccupancy = (
  seats: Seat[],
  segmentId: string
): Seat[] => {
  return seats.map(seat => {
    if (seat.occupancy) {
      const updatedOccupancy = {
        ...seat.occupancy,
        occupiedSegments: seat.occupancy.occupiedSegments.filter(id => id !== segmentId),
        passengerIds: [] // Reset passenger IDs untuk segment ini
      };
      
      // Jika tidak ada segment yang menggunakan seat ini, hapus occupancy
      if (updatedOccupancy.occupiedSegments.length === 0) {
        const { occupancy, ...seatWithoutOccupancy } = seat;
        return seatWithoutOccupancy;
      }
      
      return {
        ...seat,
        occupancy: updatedOccupancy
      };
    }
    
    return seat;
  });
};

// Fungsi untuk mendapatkan seat availability dengan mempertimbangkan reuse
export const getSeatAvailabilityWithReuse = (
  seat: Seat,
  currentSegmentId?: string
): {
  isAvailable: boolean;
  occupiedInSegments: string[];
  passengerCount: number;
  canBeReused: boolean;
} => {
  const baseAvailability = seat.available;
  
  if (!seat.occupancy) {
    return {
      isAvailable: baseAvailability,
      occupiedInSegments: [],
      passengerCount: 0,
      canBeReused: false
    };
  }
  
  const { occupiedSegments = [], passengerIds = [] } = seat.occupancy;
  
  // Cek jika seat sedang digunakan di segment lain
  const isOccupiedInOtherSegment = occupiedSegments.some(
    segmentId => segmentId !== currentSegmentId
  );
  
  // Seat dapat digunakan jika:
  // 1. Seat available secara umum, DAN
  // 2. Tidak sedang digunakan di segment saat ini, DAN
  // 3. Jika sedang digunakan di segment lain, masih bisa reuse asalkan bukan segment yang sama
  const isAvailable = baseAvailability && 
    !occupiedSegments.includes(currentSegmentId || '');
  
  const canBeReused = isOccupiedInOtherSegment && isAvailable;
  
  return {
    isAvailable,
    occupiedInSegments,
    passengerCount: passengerIds.length,
    canBeReused
  };
};

// Fungsi untuk menghitung seat reuse statistics
export const calculateReuseStatistics = (
  wagons: any[],
  currentSegmentId?: string
): {
  totalSeats: number;
  availableSeats: number;
  reusedSeats: number;
  occupiedSeats: number;
  reuseRate: number;
} => {
  let totalSeats = 0;
  let availableSeats = 0;
  let reusedSeats = 0;
  let occupiedSeats = 0;
  
  wagons.forEach(wagon => {
    wagon.seats.forEach((seat: Seat) => {
      totalSeats++;
      
      if (seat.available) {
        availableSeats++;
      }
      
      if (seat.occupancy) {
        const { occupiedSegments = [] } = seat.occupancy;
        
        // Hitung seat yang digunakan di segment lain
        const isOccupiedInOtherSegment = occupiedSegments.some(
          segmentId => segmentId !== currentSegmentId
        );
        
        if (isOccupiedInOtherSegment) {
          reusedSeats++;
        }
        
        if (occupiedSegments.length > 0) {
          occupiedSeats++;
        }
      }
    });
  });
  
  const reuseRate = totalSeats > 0 ? (reusedSeats / totalSeats) * 100 : 0;
  
  return {
    totalSeats,
    availableSeats,
    reusedSeats,
    occupiedSeats,
    reuseRate: Math.round(reuseRate)
  };
};