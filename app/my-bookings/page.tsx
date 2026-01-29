// app/my-bookings/page.tsx
'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  TicketIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  DocumentArrowUpIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  PrinterIcon,
  ChevronRightIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  TruckIcon,
  WifiIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/app/lib/supabaseClient';
import { useAuth } from '@/app/contexts/AuthContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import 'jspdf-autotable';

interface SeatInfo {
  coach: string;
  seat: string;
  wagon_number?: string;
  coach_type?: string;
}

interface Segment {
  origin: string;
  destination: string;
  departure_date: string;
  departure_time: string;
  arrival_time: string;
  train_code: string;
  train_name: string;
  train_class: string;
  train_type?: string;
  duration: string;
  platform?: string;
  station_code_origin?: string;
  station_code_destination?: string;
  seat_info?: SeatInfo;
  baggage_allowance?: string;
  amenities?: string[];
  segment_order?: number;
}

interface Booking {
  id: string;
  booking_code: string;
  order_id: string;
  ticket_number?: string;
  passenger_name: string;
  passenger_email: string;
  passenger_phone: string;
  train_name: string;
  train_code?: string;
  train_class?: string;
  train_type: string;
  origin: string;
  destination: string;
  departure_date: string;
  departure_time: string;
  arrival_time: string;
  segments?: Segment[];
  is_multi_segment?: boolean;
  total_segments?: number;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method?: string;
  passenger_count: number;
  created_at: string;
  updated_at: string;
  selected_seats?: any;
  has_ticket?: boolean;
  ticket_id?: string;
  booking_date?: string;
  train_number?: string;
  operator?: string;
  user_id?: string;
  pnr_number?: string;
  coach_number?: string;
  seat_numbers?: string[];
  transaction_id?: string;
  payment_proof?: string;
  checkin_status?: boolean;
  baggage_allowance?: string;
  trip_duration?: string;
  notes?: string;
  platform?: string;
  is_insurance_included?: boolean;
  insurance_amount?: number;
  convenience_fee?: number;
  discount_amount?: number;
  final_amount?: number;
  cancellation_reason?: string;
  refund_amount?: number;
  refund_status?: string;
  station_details?: {
    origin?: {
      name: string;
      code: string;
      city: string;
    };
    destination?: {
      name: string;
      code: string;
      city: string;
    };
  };
}

type FilterStatus = 'all' | 'paid' | 'waiting' | 'active' | 'completed' | 'cancelled' | 'refunded';

// Mapping nama kereta berdasarkan kode
const TRAIN_MAPPINGS: Record<string, { name: string; operator: string; class: string }> = {
  'KA-01': { name: 'Argo Wilis', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-02': { name: 'Argo Parahyangan', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-03': { name: 'Turangga', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-04': { name: 'Sancaka', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-05': { name: 'Mutiara Selatan', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-06': { name: 'Mutiara Timur', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-07': { name: 'Taksaka', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-08': { name: 'Bima', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-09': { name: 'Gajayana', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-10': { name: 'Sembrani', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-11': { name: 'Bangunkarta', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-12': { name: 'Fajar/Senja Utama', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Ekonomi' },
  'KA-13': { name: 'Sribilah', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Ekonomi' },
  'KA-14': { name: 'Serelo', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Ekonomi' },
  'KA-15': { name: 'Rajawali', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-16': { name: 'Tegar', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-17': { name: 'Harina', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-18': { name: 'Pangrango', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-19': { name: 'Gajah Wong', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-20': { name: 'Jaka Tingkir', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-21': { name: 'Lodaya', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-22': { name: 'Malabar', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Ekonomi' },
  'KA-23': { name: 'Kutojaya', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Ekonomi' },
  'KA-24': { name: 'Ciremai', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-25': { name: 'Tawang Alun', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Ekonomi' },
  'KA-26': { name: 'Logawa', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Ekonomi' },
  'KA-27': { name: 'Matarmaja', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Ekonomi' },
  'KA-28': { name: 'Kertanegara', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Ekonomi' },
  'KA-29': { name: 'Probowangi', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Ekonomi' },
  'KA-30': { name: 'Sri Tanjung', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Ekonomi' },
  'MS-001': { name: 'Perjalanan Multi Segment', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' }
};

// Fungsi untuk memvalidasi dan membersihkan data booking dengan nama kereta yang benar
const validateAndCleanBooking = (data: any): Booking | null => {
  try {
    if (!data) return null;

    // Parse segments jika exists
    let segments: Segment[] = [];
    if (data.segments && Array.isArray(data.segments) && data.segments.length > 0) {
      segments = data.segments.map((segment: any, index: number) => {
        const trainCode = segment.train_code || segment.trainCode || data.train_code || '';
        const trainMapping = TRAIN_MAPPINGS[trainCode] || {
          name: segment.train_name || data.train_name || 'Kereta Api',
          operator: 'PT. Kereta Api Indonesia (KAI)',
          class: segment.train_class || data.train_class || 'Ekonomi'
        };

        return {
          origin: segment.origin || data.origin || '',
          destination: segment.destination || data.destination || '',
          departure_date: segment.departure_date || segment.departureDate || data.departure_date || new Date().toISOString().split('T')[0],
          departure_time: segment.departure_time || segment.departureTime || data.departure_time || '08:00',
          arrival_time: segment.arrival_time || segment.arrivalTime || data.arrival_time || '12:00',
          train_code: trainCode,
          train_name: trainMapping.name,
          train_class: segment.train_class || segment.trainClass || trainMapping.class,
          train_type: segment.train_type || segment.trainType || data.train_type || trainMapping.class,
          duration: segment.duration || calculateTripDuration(
            segment.departure_time || data.departure_time,
            segment.arrival_time || data.arrival_time
          ),
          platform: segment.platform || data.platform,
          station_code_origin: segment.station_code_origin,
          station_code_destination: segment.station_code_destination,
          seat_info: segment.seat_info || {
            coach: segment.coach_number || data.coach_number || '',
            seat: segment.seat_numbers?.join(', ') || data.seat_numbers?.join(', ') || segment.selected_seats?.join(', ') || '',
            wagon_number: segment.coach_number || data.coach_number || '',
            coach_type: segment.coach_type || data.coach_type
          },
          baggage_allowance: segment.baggage_allowance || data.baggage_allowance || '20kg',
          amenities: segment.amenities || data.amenities || ['AC', 'Toilet', 'Snack'],
          segment_order: index + 1
        };
      });
    }

    // Get main train info
    const trainCode = data.train_code || data.trainCode || '';
    const trainMapping = TRAIN_MAPPINGS[trainCode] || {
      name: data.train_name || 'Kereta Api',
      operator: 'PT. Kereta Api Indonesia (KAI)',
      class: data.train_class || 'Ekonomi'
    };

    const booking: Booking = {
      id: data.id || `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      booking_code: data.booking_code || data.bookingCode || `BOOK-${Date.now().toString().slice(-8)}`,
      order_id: data.order_id || data.orderId || `ORDER-${Date.now()}`,
      ticket_number: data.ticket_number || data.ticketNumber,
      passenger_name: data.passenger_name || data.passengerName || data.customerName || 'Penumpang',
      passenger_email: data.passenger_email || data.passengerEmail || data.customerEmail || '',
      passenger_phone: data.passenger_phone || data.passengerPhone || data.customerPhone || '',
      train_name: trainMapping.name,
      train_code: trainCode,
      train_class: data.train_class || data.trainClass || trainMapping.class,
      train_type: data.train_type || data.trainType || trainMapping.class,
      origin: data.origin || '',
      destination: data.destination || '',
      departure_date: data.departure_date || data.departureDate || new Date().toISOString().split('T')[0],
      departure_time: data.departure_time || data.departureTime || '08:00',
      arrival_time: data.arrival_time || data.arrivalTime || '12:00',
      segments: segments.length > 0 ? segments : undefined,
      is_multi_segment: segments.length > 1,
      total_segments: segments.length || 1,
      total_amount: Number(data.total_amount || data.totalAmount || 0),
      status: data.status || 'pending',
      payment_status: data.payment_status || data.paymentStatus || 'pending',
      payment_method: data.payment_method || data.paymentMethod,
      passenger_count: Number(data.passenger_count || data.passengerCount || 1),
      created_at: data.created_at || data.createdAt || new Date().toISOString(),
      updated_at: data.updated_at || data.updatedAt || new Date().toISOString(),
      selected_seats: data.selected_seats || data.selectedSeats,
      has_ticket: data.has_ticket || !!data.ticket_number,
      ticket_id: data.ticket_id,
      booking_date: data.booking_date || data.created_at || new Date().toISOString(),
      train_number: data.train_number,
      operator: trainMapping.operator,
      user_id: data.user_id,
      pnr_number: data.pnr_number,
      coach_number: data.coach_number,
      seat_numbers: data.seat_numbers || (data.selected_seats ? formatSelectedSeats(data.selected_seats) : []),
      transaction_id: data.transaction_id,
      payment_proof: data.payment_proof,
      checkin_status: data.checkin_status || false,
      baggage_allowance: data.baggage_allowance || '20kg',
      trip_duration: data.trip_duration,
      notes: data.notes,
      platform: data.platform || 'web',
      is_insurance_included: data.is_insurance_included || false,
      insurance_amount: Number(data.insurance_amount || 0),
      convenience_fee: Number(data.convenience_fee || 0),
      discount_amount: Number(data.discount_amount || 0),
      final_amount: Number(data.final_amount || data.total_amount || 0),
      cancellation_reason: data.cancellation_reason,
      refund_amount: Number(data.refund_amount || 0),
      refund_status: data.refund_status,
      station_details: data.station_details || {
        origin: {
          name: data.origin || '',
          code: data.station_code_origin || '',
          city: data.origin_city || ''
        },
        destination: {
          name: data.destination || '',
          code: data.station_code_destination || '',
          city: data.destination_city || ''
        }
      }
    };

    return booking;
  } catch (error) {
    console.error('Error validating booking:', error);
    return null;
  }
};

// Fungsi helper untuk format seats
const formatSelectedSeats = (selectedSeats: any): string[] => {
  if (!selectedSeats || selectedSeats === 'null' || selectedSeats === 'undefined') {
    return [];
  }

  try {
    if (typeof selectedSeats === 'string') {
      if (selectedSeats.includes('[')) {
        try {
          const parsed = JSON.parse(selectedSeats);
          if (Array.isArray(parsed)) {
            return parsed.map(seat => {
              if (typeof seat === 'string') return seat.trim();
              if (seat && typeof seat === 'object') {
                return seat.seatNumber || seat.number || seat.id || seat.toString();
              }
              return String(seat).trim();
            }).filter(Boolean);
          }
        } catch {
          return selectedSeats.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }
      return selectedSeats.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    if (Array.isArray(selectedSeats)) {
      return selectedSeats.map(seat => {
        if (typeof seat === 'string') return seat.trim();
        if (seat && typeof seat === 'object') {
          return seat.seatNumber || seat.number || seat.id || JSON.stringify(seat);
        }
        return String(seat).trim();
      }).filter(Boolean);
    }

    return [];
  } catch (error) {
    console.error('Error formatting seats:', error);
    return [];
  }
};

// Fungsi untuk mendapatkan nama kereta yang benar
const getTrainDisplayName = (booking: Booking): string => {
  if (booking.segments && booking.segments.length > 1) {
    return 'Perjalanan Multi Segment';
  }
  
  if (booking.train_code && TRAIN_MAPPINGS[booking.train_code]) {
    return TRAIN_MAPPINGS[booking.train_code].name;
  }
  
  return booking.train_name || 'Kereta Api';
};

// Fungsi untuk mendapatkan kelas kereta
const getTrainClassDisplay = (trainClass?: string, trainType?: string): string => {
  if (trainClass) {
    const classMappings: Record<string, string> = {
      'executive': 'Eksekutif',
      'economy': 'Ekonomi',
      'business': 'Bisnis',
      'premium_economy': 'Ekonomi Premium',
      'first_class': 'Kelas Pertama',
      'executive_premium': 'Eksekutif Premium',
      'business_premium': 'Bisnis Premium',
      'eksekutif': 'Eksekutif',
      'ekonomi': 'Ekonomi',
      'bisnis': 'Bisnis'
    };

    const lowerClass = trainClass.toLowerCase();
    return classMappings[lowerClass] || trainClass;
  }

  if (trainType) {
    const typeMappings: Record<string, string> = {
      'executive': 'Eksekutif',
      'economy': 'Ekonomi',
      'business': 'Bisnis',
      'premium': 'Premium'
    };

    const lowerType = trainType.toLowerCase();
    return typeMappings[lowerType] || trainType;
  }

  return 'Ekonomi';
};

// Fungsi untuk menghitung durasi perjalanan
const calculateTripDuration = (departureTime: string, arrivalTime: string): string => {
  try {
    const [depHour, depMin] = departureTime.split(':').map(Number);
    const [arrHour, arrMin] = arrivalTime.split(':').map(Number);

    let totalMinutes = (arrHour * 60 + arrMin) - (depHour * 60 + depMin);
    if (totalMinutes < 0) totalMinutes += 24 * 60;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}j`;
    return `${hours}j ${minutes}m`;
  } catch {
    return '--';
  }
};

// Fungsi untuk generate QR code URL
const generateQRCodeURL = (text: string, size = 150): string => {
  const encodedText = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedText}&format=png&margin=10`;
};

const formatDateForInvoice = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleDateString('id-ID', { month: 'long' });
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    return `${day} ${month} ${year} | ${time.replace(/:/g, '.')}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

const formatCurrencyForPDF = (amount: number): string => {
  return `Rp ${amount.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: true
  })}`;
};

const downloadInvoicePDF = async (booking: Booking) => {
  try {
    const doc = new jsPDF();
    const isPaid = booking.payment_status === 'paid' || booking.status === 'confirmed';
    const isMultiSegment = booking.is_multi_segment && booking.segments && booking.segments.length > 1;

    // --- 1. HEADER SECTION ---
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');

    doc.setFillColor(253, 126, 20);
    doc.rect(15, 15, 8, 8, 'F');
    doc.text('TRIPGO', 26, 23);

    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text('Invoice #', 195, 23, { align: 'right' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(booking.booking_code, 195, 29, { align: 'right' });

    // --- 2. STAMP SECTION ---
    if (isPaid) {
      const stampX = 145;
      const stampY = 40;
      const angle = 12;
      const rad = -angle * Math.PI / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      doc.setDrawColor(0, 180, 180);
      doc.setLineWidth(0.8);
      doc.setTextColor(0, 180, 180);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');

      const w = 45;
      const h = 8;
      const cx = stampX + w / 2;
      const cy = stampY + h / 2;

      const p = [
        { x: -w / 2, y: -h / 2 },
        { x: w / 2, y: -h / 2 },
        { x: w / 2, y: h / 2 },
        { x: -w / 2, y: h / 2 }
      ];

      const rp = p.map(pt => ({
        x: cx + (pt.x * cos - pt.y * sin),
        y: cy + (pt.x * sin + pt.y * cos)
      }));

      for (let i = 0; i < 4; i++) {
        doc.line(rp[i].x, rp[i].y, rp[(i + 1) % 4].x, rp[(i + 1) % 4].y);
      }

      doc.text('PAID & DELIVERED', cx, cy + 1.5, { align: 'center', angle: -angle });
    }

    // --- 3. BILLING INFORMATION ---
    let y = 60;

    doc.setFontSize(9);
    doc.setTextColor(140, 140, 140);
    doc.setFont('helvetica', 'normal');
    doc.text('BILL TO (PASSENGER):', 15, y);

    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.text(booking.passenger_name || 'Passenger', 15, y + 8);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(140, 140, 140);
    doc.text('Type: Train Passenger', 15, y + 15);
    doc.text('Server: railway.tripgo.id', 15, y + 21);

    doc.text('Payment Date:', 120, y);
    doc.text('Transaction ID:', 120, y + 15);
    doc.text('Status:', 120, y + 23);

    const paymentDateStr = formatDateForInvoice(booking.created_at || new Date().toISOString());
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.text(paymentDateStr, 195, y + 5, { align: 'right' });
    doc.text(booking.booking_code, 195, y + 15, { align: 'right' });

    if (isPaid) {
      doc.setDrawColor(34, 197, 94);
      (doc as any).roundedRect(175, y + 19, 20, 6, 1, 1, 'D');
      doc.setTextColor(34, 197, 94);
      doc.setFontSize(9);
      doc.text('LUNAS', 185, y + 23.2, { align: 'center' });
    } else {
      doc.setDrawColor(239, 68, 68);
      (doc as any).roundedRect(172, y + 19, 23, 6, 1, 1, 'D');
      doc.setTextColor(239, 68, 68);
      doc.setFontSize(9);
      doc.text('PENDING', 183.5, y + 23.2, { align: 'center' });
    }

    // --- 4. PRODUCT DESCRIPTION TABLE ---
    y = 110;
    doc.setFillColor(248, 250, 252);
    (doc as any).roundedRect(15, y - 6, 180, 10, 1, 1, 'F');

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.text('PRODUCT DESCRIPTION', 20, y);
    doc.text('QTY', 115, y, { align: 'center' });
    doc.text('AMOUNT', 190, y, { align: 'right' });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(15, y + 4, 195, y + 4);

    y += 15;

    if (isMultiSegment && booking.segments) {
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(11);
      doc.text(`[ MULTI SEGMENT TICKET - ${booking.total_segments} JOURNEYS ]`, 15, y);
      
      booking.segments.forEach((segment, index) => {
        y += 7;
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        const trainName = TRAIN_MAPPINGS[segment.train_code]?.name || segment.train_name;
        doc.text(`${index + 1}. ${trainName} - ${segment.origin} → ${segment.destination}`, 15, y);
      });
    } else {
      const trainDisplayName = getTrainDisplayName(booking);
      const trainClassStr = getTrainClassDisplay(booking.train_class, booking.train_type);
      
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(11);
      doc.text(`[ ${trainDisplayName} - ${trainClassStr} ]`, 15, y);
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(`Digital ticket successfully delivered to ${booking.passenger_name}.`, 15, y + 6);

    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text(booking.passenger_count.toString(), 115, y, { align: 'center' });
    doc.text(formatCurrencyForPDF(booking.total_amount || 0), 195, y, { align: 'right' });

    doc.line(15, y + 15, 195, y + 15);
    y += 25;

    // --- 5. NOTES AND TOTALS ---
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(249, 249, 249);
    doc.roundedRect(15, y, 90, 25, 1, 1, 'FD');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'bold');
    doc.text('Note:', 20, y + 8);
    doc.setFont('helvetica', 'normal');
    doc.text('All transactions are final. This receipt serves as official', 20, y + 13);
    doc.text('proof of purchase for your digital railway ticket.', 20, y + 18);

    const subtotal = booking.total_amount || 0;
    const adminFee = booking.convenience_fee || 5000;
    const grandTotal = (booking.final_amount || booking.total_amount || 0);

    const labelX = 130;
    const valueX = 195;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Original Item Price:', labelX, y + 5);
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrencyForPDF(subtotal), valueX, y + 5, { align: 'right' });

    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('Service Fee:', labelX, y + 5);
    doc.setTextColor(40, 40, 40);
    doc.text(formatCurrencyForPDF(adminFee), valueX, y + 5, { align: 'right' });

    y += 15;
    doc.line(130, y, 195, y);

    y += 10;
    doc.setFontSize(13);
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.text('Grand Total:', labelX, y);

    doc.setTextColor(37, 99, 235);
    doc.setFontSize(15);
    doc.text(formatCurrencyForPDF(grandTotal), valueX, y, { align: 'right' });

    // --- 6. FOOTER ---
    const footerY = 270;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for supporting TripGo!', 105, footerY, { align: 'center' });
    doc.text('Website: railway.tripgo.id | Need help? Contact us on Discord.', 105, footerY + 5, { align: 'center' });

    const fileName = `Invoice-${booking.booking_code}.pdf`;
    doc.save(fileName);
    return fileName;

  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    alert('Gagal membuat invoice PDF. Silakan coba lagi.');
    return null;
  }
};

// Fungsi untuk format date untuk tiket
const formatDateForTicket = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
};

// Fungsi untuk format multi segment info
const formatMultiSegmentInfo = (booking: Booking): string => {
  if (!booking.segments || booking.segments.length <= 1) {
    return `${booking.origin} → ${booking.destination}`;
  }
  
  const firstSegment = booking.segments[0];
  const lastSegment = booking.segments[booking.segments.length - 1];
  
  return `${firstSegment.origin} → ${lastSegment.destination} (${booking.segments.length} segmen)`;
};

// Fungsi untuk mendapatkan semua kursi dari multi segment
const getAllSeatsInfo = (booking: Booking): { coach: string; seat: string; segment: number }[] => {
  if (!booking.segments) {
    return booking.seat_numbers 
      ? booking.seat_numbers.map(seat => ({ 
          coach: booking.coach_number || '', 
          seat,
          segment: 1
        }))
      : [];
  }
  
  return booking.segments
    .filter(segment => segment.seat_info)
    .map((segment, index) => ({
      coach: segment.seat_info!.coach,
      seat: segment.seat_info!.seat,
      segment: index + 1
    }));
};

// Fungsi untuk download PDF Ticket
const downloadTicketPDF = async (booking: Booking) => {
  try {
    const doc = new jsPDF();
    const isMultiSegment = booking.is_multi_segment && booking.segments && booking.segments.length > 1;
    const segments = booking.segments || [{
      origin: booking.origin,
      destination: booking.destination,
      departure_date: booking.departure_date,
      departure_time: booking.departure_time,
      arrival_time: booking.arrival_time,
      train_code: booking.train_code,
      train_name: getTrainDisplayName(booking),
      train_class: booking.train_class || booking.train_type,
      train_type: booking.train_type,
      duration: booking.trip_duration || calculateTripDuration(booking.departure_time, booking.arrival_time),
      platform: booking.platform,
      station_code_origin: booking.station_details?.origin?.code,
      station_code_destination: booking.station_details?.destination?.code,
      seat_info: {
        coach: booking.coach_number || '',
        seat: booking.seat_numbers?.join(', ') || '',
        wagon_number: booking.coach_number || '',
        coach_type: booking.train_class
      },
      baggage_allowance: booking.baggage_allowance,
      amenities: ['AC', 'Toilet', 'Snack']
    }];

    // Header
    doc.setFillColor(253, 126, 20);
    doc.rect(0, 0, 210, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('TRIPGO E-TICKET', 105, 18, { align: 'center' });

    doc.setFontSize(12);
    doc.text('Official Digital Railway Ticket', 105, 25, { align: 'center' });

    // Multi Segment Badge
    if (isMultiSegment) {
      doc.setFillColor(59, 130, 246);
      doc.roundedRect(10, 35, 190, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`MULTI SEGMENT - ${segments.length} PERJALANAN`, 105, 41, { align: 'center' });
    }

    // Ticket Details
    let yPosition = isMultiSegment ? 50 : 45;

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.text('Booking Code:', 20, yPosition);
    doc.setFontSize(12);
    doc.text(booking.booking_code, 20, yPosition + 7);

    doc.setFontSize(10);
    doc.text('Ticket Number:', 120, yPosition);
    doc.setFontSize(12);
    doc.text(booking.ticket_number || booking.booking_code, 120, yPosition + 7);

    yPosition += 20;

    doc.setFontSize(10);
    doc.text('Passenger Name:', 20, yPosition);
    doc.setFontSize(14);
    doc.text(booking.passenger_name, 20, yPosition + 7);

    yPosition += 20;

    // Untuk multi segment, tampilkan semua segment
    if (isMultiSegment) {
      segments.forEach((segment, index) => {
        // Segment Header
        doc.setFillColor(240, 240, 240);
        doc.roundedRect(20, yPosition, 170, 40, 3, 3, 'F');
        
        // Segment Number
        doc.setFillColor(253, 126, 20);
        doc.circle(25, yPosition + 8, 6, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}`, 25, yPosition + 10.5, { align: 'center' });

        // Train Info - Menggunakan nama kereta dari mapping
        const trainName = TRAIN_MAPPINGS[segment.train_code]?.name || segment.train_name;
        doc.setTextColor(253, 126, 20);
        doc.setFontSize(11);
        doc.text(trainName, 35, yPosition + 10);
        
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        const trainClass = getTrainClassDisplay(segment.train_class, segment.train_type);
        doc.text(`${trainClass} | ${segment.train_code || ''}`, 35, yPosition + 17);

        // Route
        const routeY = yPosition + 10;
        doc.setFontSize(12);
        doc.setTextColor(40, 40, 40);
        doc.text(segment.origin, 100, routeY, { align: 'center' });
        
        doc.setTextColor(253, 126, 20);
        doc.text('→', 115, routeY);
        
        doc.setTextColor(40, 40, 40);
        doc.text(segment.destination, 140, routeY, { align: 'center' });

        // Schedule
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(`Berangkat: ${segment.departure_time} | Sampai: ${segment.arrival_time}`, 100, routeY + 8, { align: 'center' });
        doc.text(`Tanggal: ${formatDateForTicket(segment.departure_date)}`, 100, routeY + 15, { align: 'center' });

        // Seat Info
        if (segment.seat_info) {
          const seatInfo = segment.seat_info;
          doc.setFillColor(59, 130, 246, 10);
          doc.roundedRect(150, yPosition + 5, 35, 30, 2, 2, 'F');
          
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text('GERBONG', 167.5, yPosition + 12, { align: 'center' });
          
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(59, 130, 246);
          doc.text(seatInfo.coach || '-', 167.5, yPosition + 20, { align: 'center' });
          
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text('KURSI', 167.5, yPosition + 27, { align: 'center' });
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(40, 40, 40);
          doc.text(seatInfo.seat || '-', 167.5, yPosition + 32, { align: 'center' });
        }

        yPosition += 50;
      });
    } else {
      // Single segment display
      const segment = segments[0];
      
      // Train Info Box
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(20, yPosition, 170, 40, 3, 3, 'F');

      const trainName = TRAIN_MAPPINGS[segment.train_code]?.name || segment.train_name;
      const trainClass = getTrainClassDisplay(segment.train_class, segment.train_type);

      doc.setFontSize(12);
      doc.setTextColor(253, 126, 20);
      doc.text(trainName, 25, yPosition + 10);

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`${trainClass} | ${segment.train_code || ''}`, 25, yPosition + 17);

      // Route with arrow
      const routeY = yPosition + 10;
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text(segment.origin, 100, routeY, { align: 'center' });
      
      doc.setTextColor(253, 126, 20);
      doc.text('→', 115, routeY);
      
      doc.setTextColor(40, 40, 40);
      doc.text(segment.destination, 140, routeY, { align: 'center' });

      // Schedule
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(`Berangkat: ${segment.departure_time} | Sampai: ${segment.arrival_time}`, 100, routeY + 8, { align: 'center' });
      doc.text(`Tanggal: ${formatDateForTicket(segment.departure_date)}`, 100, routeY + 15, { align: 'center' });

      // Enhanced Seat Info Box
      const seatInfo = segment.seat_info || {
        coach: booking.coach_number || '',
        seat: booking.seat_numbers?.join(', ') || '',
        wagon_number: booking.coach_number || '',
        coach_type: booking.train_class
      };

      doc.setFillColor(59, 130, 246, 20);
      doc.roundedRect(150, yPosition + 5, 35, 30, 2, 2, 'F');
      
      // Gerbong Info
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('GERBONG', 167.5, yPosition + 12, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text(seatInfo.coach || '-', 167.5, yPosition + 20, { align: 'center' });
      
      // Kursi Info
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('KURSI', 167.5, yPosition + 27, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text(seatInfo.seat || '-', 167.5, yPosition + 32, { align: 'center' });

      yPosition += 50;
    }

    // Journey Details Table
    autoTable(doc, {
      startY: yPosition,
      head: [['SEGMENT', 'RUTE', 'TANGGAL', 'WAKTU', 'DURASI', 'GERBONG', 'KURSI', 'PERON']],
      body: segments.map((segment, index) => {
        const seatInfo = segment.seat_info || {
          coach: booking.coach_number || '',
          seat: booking.seat_numbers?.join(', ') || '',
          wagon_number: booking.coach_number || ''
        };
        
        const trainName = TRAIN_MAPPINGS[segment.train_code]?.name || segment.train_name;
        
        return [
          isMultiSegment ? `Segmen ${index + 1}` : 'Utama',
          `${segment.origin} → ${segment.destination}`,
          formatDateForTicket(segment.departure_date),
          `${segment.departure_time} - ${segment.arrival_time}`,
          segment.duration,
          seatInfo.coach || '-',
          seatInfo.seat || '-',
          segment.platform || '-'
        ];
      }),
      theme: 'grid',
      headStyles: { 
        fillColor: [60, 60, 60], 
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 45 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 25 },
        7: { cellWidth: 15 }
      },
      margin: { left: 20, right: 20 },
      styles: { cellPadding: 3 }
    });

    const tableY = (doc as any).lastAutoTable.finalY || yPosition + 30;

    // QR Code Section
    try {
      // Generate QR data
      const qrData = JSON.stringify({
        booking_code: booking.booking_code,
        ticket_number: booking.ticket_number || booking.booking_code,
        passenger_name: booking.passenger_name,
        is_multi_segment: isMultiSegment,
        total_segments: segments.length,
        segments: segments.map(segment => ({
          train: TRAIN_MAPPINGS[segment.train_code]?.name || segment.train_name,
          train_code: segment.train_code,
          route: `${segment.origin} to ${segment.destination}`,
          date: segment.departure_date,
          time: segment.departure_time,
          class: segment.train_class,
          coach: segment.seat_info?.coach || booking.coach_number,
          seat: segment.seat_info?.seat || booking.seat_numbers?.join(', ')
        }))
      });

      const qrCodeURL = generateQRCodeURL(qrData, 120);

      // Fetch QR code image
      const response = await fetch(qrCodeURL);
      if (!response.ok) throw new Error('Failed to fetch QR code');

      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64data = reader.result as string;
        doc.addImage(base64data, 'PNG', 145, tableY + 10, 40, 40);

        // Footer text under QR
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('Scan untuk verifikasi', 165, tableY + 55, { align: 'center' });

        // Summary Info
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        
        let summaryY = tableY + 60;
        doc.text(`PNR: ${booking.pnr_number || 'N/A'} | Total Segmen: ${segments.length}`, 20, summaryY);
        
        summaryY += 7;
        if (booking.baggage_allowance) {
          doc.text(`Bagasi: ${booking.baggage_allowance}`, 20, summaryY);
          summaryY += 7;
        }
        
        if (booking.platform) {
          doc.text(`Platform Check-in: ${booking.platform}`, 20, summaryY);
          summaryY += 7;
        }

        // Seat Summary
        if (booking.seat_numbers && booking.seat_numbers.length > 0) {
          const uniqueCoaches = [...new Set(segments.map(s => s.seat_info?.coach).filter(Boolean))];
          if (uniqueCoaches.length > 0) {
            doc.text(`Detail Kursi: ${booking.seat_numbers.join(', ')} (Gerbong: ${uniqueCoaches.join(', ')})`, 20, summaryY);
            summaryY += 7;
          }
        }

        // Terms and Conditions
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        const terms = [
          '• Tiket digital resmi. Tidak memerlukan salinan fisik.',
          '• Hadir di stasiun minimal 30 menit sebelum keberangkatan.',
          '• Wajib membawa kartu identitas resmi untuk verifikasi.',
          '• Tiket tidak dapat dialihkan kepada orang lain.',
          '• Untuk bantuan, hubungi: help@railway.tripgo.id'
        ];

        terms.forEach((term, index) => {
          doc.text(term, 20, summaryY + 10 + (index * 4));
        });

        // Save the PDF
        const fileName = isMultiSegment 
          ? `Ticket-Multi-${booking.booking_code}.pdf`
          : `Ticket-${booking.booking_code}.pdf`;
        doc.save(fileName);
      };

      reader.readAsDataURL(blob);

    } catch (qrError) {
      console.error('Error loading QR code:', qrError);
      // Fallback tanpa QR
      doc.setFontSize(10);
      doc.setTextColor(200, 0, 0);
      doc.text('QR Code tidak tersedia', 165, tableY + 30, { align: 'center' });

      const fileName = isMultiSegment 
        ? `Ticket-Multi-${booking.booking_code}.pdf`
        : `Ticket-${booking.booking_code}.pdf`;
      doc.save(fileName);
    }

  } catch (error) {
    console.error('Error generating ticket PDF:', error);
    alert('Gagal membuat tiket PDF');
  }
};

export default function MyBookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [justPaidHighlight, setJustPaidHighlight] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState<string | null>(null);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [showRefreshNotification, setShowRefreshNotification] = useState(false);

  const isLoadingRef = useRef(false);
  const initialLoadDone = useRef(false);
  const supabaseChannelRef = useRef<any>(null);

  // Check URL parameters
  useEffect(() => {
    const justPaidFromUrl = searchParams.get('justPaid');
    const bookingCodeFromUrl = searchParams.get('bookingCode');

    if (justPaidFromUrl === 'true' && bookingCodeFromUrl) {
      setJustPaidHighlight(bookingCodeFromUrl);
      // Clean URL tanpa refresh
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  // Realtime Subscription dengan error handling yang lebih baik
  const setupRealtimeSubscription = useCallback(() => {
    if (!user?.id) {
      console.log('❌ Tidak ada user untuk realtime subscription');
      return;
    }

    // Cleanup existing subscription
    if (supabaseChannelRef.current) {
      console.log('🔌 Membersihkan subscription lama');
      supabase.removeChannel(supabaseChannelRef.current);
      supabaseChannelRef.current = null;
    }

    console.log('🔌 Setting up realtime subscription for user:', user.id);

    const channel = supabase
      .channel(`my-bookings-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings_kereta',
          filter: `user_id=eq.${user.id}`
        },
        (payload: any) => {
          console.log('🔔 Realtime update received:', payload);
          setLastUpdate(new Date());
          
          // Show notification for important updates
          if (payload.eventType === 'UPDATE') {
            const newStatus = payload.new.status;
            const oldStatus = payload.old.status;
            
            if (newStatus !== oldStatus) {
              setShowRefreshNotification(true);
              setTimeout(() => setShowRefreshNotification(false), 5000);
            }
          }
          
          // Refresh data
          loadBookings(true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`
        },
        (payload: any) => {
          console.log('💳 Transaction update:', payload);
          setLastUpdate(new Date());
          loadBookings(true);
        }
      )
      .subscribe((status: string) => {
        console.log('🔌 Subscription status:', status);
        setRealtimeConnected(status === 'SUBSCRIBED');
        
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel error, retrying in 5 seconds...');
          setTimeout(setupRealtimeSubscription, 5000);
        } else if (status === 'TIMED_OUT') {
          console.warn('⚠️ Channel timeout, reconnecting...');
          setupRealtimeSubscription();
        }
      });

    supabaseChannelRef.current = channel;

    return () => {
      console.log('🔌 Cleaning up subscription');
      if (supabaseChannelRef.current) {
        supabase.removeChannel(supabaseChannelRef.current);
        supabaseChannelRef.current = null;
      }
    };
  }, [user?.id]);

  // Load bookings dengan optimasi
  const loadBookings = useCallback(async (forceReload = false) => {
    if (isLoadingRef.current && !forceReload) {
      return;
    }

    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);

      let allBookings: Booking[] = [];

      // 1. Load from database - PRIORITY SOURCE
      if (user?.id) {
        try {
          // Load dari tabel bookings_kereta
          const { data: dbBookings, error: bookingsError } = await supabase
            .from('bookings_kereta')
            .select('*')
            .or(`user_id.eq.${user.id},passenger_email.ilike.%${user.email}%`)
            .order('departure_date', { ascending: true })
            .order('departure_time', { ascending: true });

          if (!bookingsError && dbBookings) {
            const validDbBookings = dbBookings
              .map((b: any) => validateAndCleanBooking(b))
              .filter((b): b is Booking => b !== null);

            allBookings = validDbBookings;
          }

          // Load dari tabel transactions jika ada
          const { data: transactions, error: transactionsError } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .eq('type', 'train')
            .order('created_at', { ascending: false });

          if (!transactionsError && transactions) {
            const transactionBookings = transactions.map((transaction: any) => {
              try {
                const bookingData = typeof transaction.metadata === 'string'
                  ? JSON.parse(transaction.metadata)
                  : transaction.metadata || {};

                return validateAndCleanBooking({
                  ...bookingData,
                  id: transaction.id,
                  booking_code: transaction.reference_code || bookingData.booking_code,
                  order_id: transaction.order_id,
                  total_amount: transaction.amount,
                  payment_status: transaction.status === 'completed' ? 'paid' : 'pending',
                  status: transaction.status === 'completed' ? 'confirmed' : 'pending',
                  payment_method: transaction.payment_method,
                  created_at: transaction.created_at,
                  updated_at: transaction.updated_at,
                  user_id: transaction.user_id
                });
              } catch {
                return null;
              }
            }).filter((b): b is Booking => b !== null);

            // Merge dengan existing bookings
            const existingCodes = allBookings.map(b => b.booking_code);
            const uniqueTransactionBookings = transactionBookings.filter(
              (b: Booking) => !existingCodes.includes(b.booking_code)
            );

            allBookings = [...allBookings, ...uniqueTransactionBookings];
          }
        } catch (dbError) {
          console.error('Database fetch error:', dbError);
        }
      }

      // 2. Load from localStorage for offline access
      if (allBookings.length === 0) {
        try {
          const savedBookings = localStorage.getItem('myBookings');
          if (savedBookings) {
            const parsedBookings = JSON.parse(savedBookings);
            if (Array.isArray(parsedBookings)) {
              const validBookings = parsedBookings
                .map(validateAndCleanBooking)
                .filter((b): b is Booking => b !== null);
              allBookings = validBookings;
            }
          }
        } catch (localStorageError) {
          console.error('Local storage error:', localStorageError);
        }
      }

      // 3. Check for new bookings from session
      try {
        const justPaid = sessionStorage.getItem('justPaid');
        const lastBookingCode = sessionStorage.getItem('lastBookingCode');

        if (justPaid === 'true' && lastBookingCode) {
          setJustPaidHighlight(lastBookingCode);
          sessionStorage.removeItem('justPaid');
          sessionStorage.removeItem('lastBookingCode');

          setTimeout(() => {
            setJustPaidHighlight(null);
          }, 5000);
        }

        // Load latest booking from session
        const latestBooking = sessionStorage.getItem('latestBooking');
        if (latestBooking) {
          try {
            const newBooking = JSON.parse(latestBooking);
            const validatedBooking = validateAndCleanBooking(newBooking);
            if (validatedBooking) {
              const existingIndex = allBookings.findIndex(b => b.booking_code === validatedBooking.booking_code);
              if (existingIndex !== -1) {
                allBookings[existingIndex] = validatedBooking;
              } else {
                allBookings.unshift(validatedBooking);
              }
            }
            sessionStorage.removeItem('latestBooking');
          } catch (parseError) {
            console.error('Error parsing latest booking:', parseError);
            sessionStorage.removeItem('latestBooking');
          }
        }
      } catch (sessionError) {
        console.error('Session storage error:', sessionError);
      }

      // 4. Tambah demo data jika kosong
      if (allBookings.length === 0 && !user) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const demoBookings: Booking[] = [
          {
            id: 'demo-1',
            booking_code: 'BOOK-206942-JUBG',
            order_id: 'ORDER-1767783206942-JUBG',
            ticket_number: 'TICKET-43328554',
            passenger_name: 'Reisan',
            passenger_email: 'reisan@example.com',
            passenger_phone: '08453665664',
            train_name: 'Argo Parahyangan',
            train_code: 'KA-02',
            train_class: 'Executive',
            train_type: 'Executive',
            origin: 'Stasiun Bandung',
            destination: 'Stasiun Gambir',
            departure_date: tomorrow.toISOString().split('T')[0],
            departure_time: '05:00',
            arrival_time: '10:00',
            segments: [
              {
                origin: 'Stasiun Bandung',
                destination: 'Stasiun Gambir',
                departure_date: tomorrow.toISOString().split('T')[0],
                departure_time: '05:00',
                arrival_time: '10:00',
                train_code: 'KA-02',
                train_name: 'Argo Parahyangan',
                train_class: 'Executive',
                train_type: 'Executive',
                duration: '5j 0m',
                platform: '3',
                station_code_origin: 'BD',
                station_code_destination: 'GMR',
                seat_info: {
                  coach: 'C2',
                  seat: '12A',
                  wagon_number: 'C2',
                  coach_type: 'Executive'
                },
                baggage_allowance: '20kg',
                amenities: ['AC', 'Toilet', 'Snack', 'Wifi'],
                segment_order: 1
              }
            ],
            is_multi_segment: false,
            total_segments: 1,
            total_amount: 412500,
            status: 'confirmed',
            payment_status: 'paid',
            payment_method: 'E-WALLET',
            passenger_count: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            selected_seats: ['12A'],
            has_ticket: true,
            booking_date: new Date().toISOString(),
            pnr_number: 'PNR123456',
            coach_number: 'C2',
            seat_numbers: ['12A'],
            transaction_id: 'TRX001',
            checkin_status: false,
            baggage_allowance: '20kg',
            trip_duration: '5j 0m',
            platform: 'web',
            is_insurance_included: true,
            insurance_amount: 10000,
            convenience_fee: 5000,
            discount_amount: 0,
            final_amount: 412500,
            station_details: {
              origin: {
                name: 'Stasiun Bandung',
                code: 'BD',
                city: 'Bandung'
              },
              destination: {
                name: 'Stasiun Gambir',
                code: 'GMR',
                city: 'Jakarta'
              }
            }
          }
        ];

        allBookings = [...allBookings, ...demoBookings];
      }

      // 5. Sort bookings by departure date (soonest first)
      allBookings.sort((a, b) => {
        const dateA = new Date(`${a.departure_date}T${a.departure_time}`);
        const dateB = new Date(`${b.departure_date}T${b.departure_time}`);
        return dateA.getTime() - dateB.getTime();
      });

      // 6. Update state
      setBookings(allBookings);
      applyFilter(activeFilter, allBookings);

      // 7. Simpan ke localStorage untuk offline access
      try {
        localStorage.setItem('myBookings', JSON.stringify(allBookings));
        localStorage.setItem('myBookingsLastUpdated', new Date().toISOString());
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }

      setLastUpdate(new Date());

    } catch (error: any) {
      console.error('Error loading bookings:', error);
      setError('Gagal memuat data booking. Silakan refresh halaman.');
      
      // Fallback ke localStorage
      try {
        const savedBookings = localStorage.getItem('myBookings');
        if (savedBookings) {
          const parsedBookings = JSON.parse(savedBookings);
          if (Array.isArray(parsedBookings)) {
            const validBookings = parsedBookings
              .map(validateAndCleanBooking)
              .filter((b): b is Booking => b !== null);
            setBookings(validBookings);
            applyFilter(activeFilter, validBookings);
          }
        }
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
      }
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
      initialLoadDone.current = true;
    }
  }, [user, activeFilter]);

  // Apply filter function
  const applyFilter = useCallback((filter: FilterStatus, bookingsList: Booking[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filtered = bookingsList.filter(booking => {
      const bookingDate = new Date(booking.departure_date);
      bookingDate.setHours(0, 0, 0, 0);
      const diffTime = bookingDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      switch (filter) {
        case 'paid':
          return booking.payment_status === 'paid' || booking.status === 'confirmed';
        case 'waiting':
          return booking.payment_status === 'pending' || booking.status === 'pending';
        case 'active':
          return (booking.payment_status === 'paid' || booking.status === 'confirmed') && diffDays >= 0 && diffDays <= 2;
        case 'completed':
          return diffDays < 0 || booking.status === 'completed';
        case 'cancelled':
          return booking.status === 'cancelled' || booking.status === 'canceled';
        case 'refunded':
          return booking.refund_status === 'processed';
        default:
          return true;
      }
    });

    setFilteredBookings(filtered);
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback((filter: FilterStatus) => {
    setActiveFilter(filter);
    applyFilter(filter, bookings);
  }, [applyFilter, bookings]);

  // Handle search
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    if (!query) {
      applyFilter(activeFilter, bookings);
      return;
    }

    const filtered = bookings.filter(booking =>
      (booking.booking_code?.toLowerCase() || '').includes(query) ||
      (booking.passenger_name?.toLowerCase() || '').includes(query) ||
      (booking.train_name?.toLowerCase() || '').includes(query) ||
      (booking.origin?.toLowerCase() || '').includes(query) ||
      (booking.destination?.toLowerCase() || '').includes(query) ||
      (booking.ticket_number?.toLowerCase() || '').includes(query) ||
      (booking.pnr_number?.toLowerCase() || '').includes(query) ||
      (booking.train_code?.toLowerCase() || '').includes(query)
    );

    setFilteredBookings(filtered);
  }, [applyFilter, activeFilter, bookings]);

  // Format functions
  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  }, []);

  const formatTime = useCallback((timeString: string) => {
    try {
      if (!timeString) return '--:--';
      if (timeString.includes(':')) return timeString;
      return timeString;
    } catch {
      return timeString;
    }
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  }, []);

  // Get status badge
  const getStatusBadge = useCallback((status: string, paymentStatus: string) => {
    const lowerStatus = (status || '').toLowerCase();
    const lowerPaymentStatus = (paymentStatus || '').toLowerCase();

    if (lowerPaymentStatus === 'paid' || lowerStatus === 'confirmed') {
      return (
        <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
          <CheckCircleIcon className="w-4 h-4 mr-1" />
          LUNAS
        </span>
      );
    } else if (lowerPaymentStatus === 'pending' || lowerStatus === 'pending') {
      return (
        <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
          <ClockIcon className="w-4 h-4 mr-1" />
          MENUNGGU PEMBAYARAN
        </span>
      );
    } else if (lowerStatus === 'cancelled' || lowerStatus === 'canceled') {
      return (
        <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
          <XCircleIcon className="w-4 h-4 mr-1" />
          DIBATALKAN
        </span>
      );
    } else if (lowerStatus === 'completed') {
      return (
        <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
          SELESAI
        </span>
      );
    } else if (lowerStatus === 'refunded') {
      return (
        <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          DIKEMBALIKAN
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
        {status?.toUpperCase() || 'PENDING'}
      </span>
    );
  }, []);

  // Handle view details
  const handleViewDetails = useCallback((booking: Booking) => {
    setSelectedBookingForDetails(booking);
  }, []);

  // Handle close details modal
  const handleCloseDetails = useCallback(() => {
    setSelectedBookingForDetails(null);
  }, []);

  // Handle print ticket dengan PDF
  const handlePrintTicket = useCallback(async (booking: Booking) => {
    if (!booking.ticket_number && !booking.booking_code) {
      alert('Tiket belum tersedia untuk booking ini');
      return;
    }

    await downloadTicketPDF(booking);
  }, []);

  // Handle download invoice dengan PDF
  const handleDownloadInvoice = useCallback(async (booking: Booking) => {
    await downloadInvoicePDF(booking);
  }, []);

  // Handle upload payment proof
  const handleUploadPaymentProof = useCallback(async (bookingCode: string) => {
    const booking = bookings.find(b => b.booking_code === bookingCode);
    if (!booking) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf,.png,.jpg,.jpeg';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        alert('File terlalu besar. Maksimal 5MB');
        return;
      }

      try {
        setUploadingProof(bookingCode);

        // Upload ke Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${bookingCode}_${Date.now()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('payment-proofs')
          .upload(fileName, file);

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('payment-proofs')
          .getPublicUrl(fileName);

        // Update database
        const { error: updateError } = await supabase
          .from('bookings_kereta')
          .update({
            payment_proof: urlData.publicUrl,
            updated_at: new Date().toISOString()
          })
          .eq('booking_code', bookingCode);

        if (updateError) throw updateError;

        // Update local state
        const updatedBookings = bookings.map(b => {
          if (b.booking_code === bookingCode) {
            return {
              ...b,
              payment_proof: urlData.publicUrl,
              updated_at: new Date().toISOString()
            };
          }
          return b;
        });

        setBookings(updatedBookings);
        applyFilter(activeFilter, updatedBookings);

        localStorage.setItem('myBookings', JSON.stringify(updatedBookings));

        alert('Bukti pembayaran berhasil diunggah. Admin akan memverifikasi.');
      } catch (error) {
        console.error('Upload error:', error);
        alert('Gagal mengunggah bukti pembayaran');
      } finally {
        setUploadingProof(null);
      }
    };

    input.click();
  }, [applyFilter, activeFilter, bookings]);

  // Handle cancel booking with refund
  const handleCancelBooking = useCallback(async (bookingCode: string) => {
    if (!confirm(`Apakah Anda yakin ingin membatalkan booking ${bookingCode}? Dana akan dikembalikan sesuai kebijakan.`)) {
      return;
    }

    try {
      const bookingToCancel = bookings.find(b => b.booking_code === bookingCode);
      if (!bookingToCancel) return;

      // Calculate refund amount (80% refund)
      const refundAmount = Math.floor((bookingToCancel.final_amount || bookingToCancel.total_amount) * 0.8);

      // Update booking in database
      const { error } = await supabase
        .from('bookings_kereta')
        .update({
          status: 'cancelled',
          payment_status: 'refunded',
          refund_amount: refundAmount,
          refund_status: 'processing',
          cancellation_reason: 'Dibatalkan oleh pengguna',
          updated_at: new Date().toISOString()
        })
        .eq('booking_code', bookingCode);

      if (error) {
        console.error('Database update error:', error);
        throw error;
      }

      // Update local state
      const updatedBookings = bookings.map(booking => {
        if (booking.booking_code === bookingCode) {
          return {
            ...booking,
            status: 'cancelled',
            payment_status: 'refunded',
            refund_amount: refundAmount,
            refund_status: 'processing',
            cancellation_reason: 'Dibatalkan oleh pengguna',
            updated_at: new Date().toISOString()
          };
        }
        return booking;
      });

      setBookings(updatedBookings);
      applyFilter(activeFilter, updatedBookings);

      localStorage.setItem('myBookings', JSON.stringify(updatedBookings));

      alert(`Booking ${bookingCode} berhasil dibatalkan. Refund sebesar ${formatCurrency(refundAmount)} akan diproses dalam 3-5 hari kerja.`);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Gagal membatalkan booking. Silakan coba lagi.');
    }
  }, [applyFilter, activeFilter, bookings, formatCurrency]);

  // Handle check-in
  const handleCheckIn = useCallback(async (bookingCode: string) => {
    try {
      const booking = bookings.find(b => b.booking_code === bookingCode);
      if (!booking) return;

      if (!booking.ticket_number) {
        alert('Tiket belum tersedia untuk check-in');
        return;
      }

      // Update check-in status in database
      const { error } = await supabase
        .from('bookings_kereta')
        .update({
          checkin_status: true,
          updated_at: new Date().toISOString()
        })
        .eq('booking_code', bookingCode);

      if (error) throw error;

      // Update local state
      const updatedBookings = bookings.map(b => {
        if (b.booking_code === bookingCode) {
          return {
            ...b,
            checkin_status: true,
            updated_at: new Date().toISOString()
          };
        }
        return b;
      });

      setBookings(updatedBookings);
      applyFilter(activeFilter, updatedBookings);

      localStorage.setItem('myBookings', JSON.stringify(updatedBookings));

      alert('Check-in berhasil! Silakan tunjukkan tiket di stasiun.');
    } catch (error) {
      console.error('Check-in error:', error);
      alert('Gagal melakukan check-in');
    }
  }, [applyFilter, activeFilter, bookings]);

  // Handle send payment link
  const handleSendPaymentLink = useCallback(async (bookingCode: string) => {
    const booking = bookings.find(b => b.booking_code === bookingCode);
    if (!booking) return;

    if (!confirm(`Kirim link pembayaran ke ${booking.passenger_email || 'email Anda'}?`)) {
      return;
    }

    try {
      // Simulate sending payment link
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update database
      const { error } = await supabase
        .from('bookings_kereta')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          payment_method: 'Payment Link',
          updated_at: new Date().toISOString()
        })
        .eq('booking_code', bookingCode);

      if (error) throw error;

      // Update local state
      const updatedBookings = bookings.map(b => {
        if (b.booking_code === bookingCode) {
          return {
            ...b,
            payment_status: 'paid',
            status: 'confirmed',
            payment_method: 'Payment Link',
            updated_at: new Date().toISOString()
          };
        }
        return b;
      });

      setBookings(updatedBookings);
      applyFilter(activeFilter, updatedBookings);

      localStorage.setItem('myBookings', JSON.stringify(updatedBookings));

      alert('Link pembayaran telah dikirim. Status booking diperbarui menjadi LUNAS.');
    } catch (error) {
      console.error('Send payment link error:', error);
      alert('Gagal mengirim link pembayaran');
    }
  }, [applyFilter, activeFilter, bookings]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalBookings = bookings.length;
    const paidBookings = bookings.filter(b => b.payment_status === 'paid').length;
    const pendingBookings = bookings.filter(b => b.payment_status === 'pending').length;
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled' || b.status === 'canceled').length;
    const refundedBookings = bookings.filter(b => b.refund_status === 'processed').length;
    const multiSegmentBookings = bookings.filter(b => b.is_multi_segment).length;

    const totalSpent = bookings
      .filter(b => b.payment_status === 'paid')
      .reduce((sum, b) => sum + (b.final_amount || b.total_amount || 0), 0);

    const pendingAmount = bookings
      .filter(b => b.payment_status === 'pending')
      .reduce((sum, b) => sum + (b.final_amount || b.total_amount || 0), 0);

    return {
      totalBookings,
      paidBookings,
      pendingBookings,
      cancelledBookings,
      refundedBookings,
      multiSegmentBookings,
      totalSpent,
      pendingAmount
    };
  }, [bookings]);

  // Setup Realtime Subscription on user change
  useEffect(() => {
    if (user?.id) {
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [user?.id, setupRealtimeSubscription]);

  // Load data on mount dan setup interval refresh
  useEffect(() => {
    if (!initialLoadDone.current || (user?.id && bookings.length === 0)) {
      loadBookings();
    }

    // Setup interval untuk refresh data setiap 30 detik
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadBookings();
      }
    }, 30000);

    return () => {
      isLoadingRef.current = false;
      clearInterval(intervalId);
    };
  }, [loadBookings, user?.id]);

  // Loading state
  if (loading && bookings.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FD7E14] mx-auto mb-6"></div>
          <p className="text-gray-600 font-medium">Memuat data booking...</p>
          <button
            onClick={() => loadBookings(true)}
            className="mt-4 px-4 py-2 text-sm bg-[#FD7E14] text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Connection Status */}
        <div className="mb-4 flex justify-end">
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${realtimeConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-gray-600">
              {realtimeConnected ? 'Realtime Connected' : 'Realtime Disconnected'}
            </span>
            {lastUpdate && (
              <span className="text-gray-500 text-xs">
                | Terakhir diperbarui: {lastUpdate.toLocaleTimeString('id-ID')}
              </span>
            )}
          </div>
        </div>

        {/* Refresh Notification */}
        {showRefreshNotification && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-blue-800 font-medium">Data booking telah diperbarui</span>
              <button
                onClick={() => setShowRefreshNotification(false)}
                className="ml-auto text-blue-500 hover:text-blue-700"
              >
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Tiket dan Booking Saya</h1>
              <p className="text-gray-600">Kelola dan lihat semua tiket Anda di satu tempat</p>
            </div>
            <div className="hidden md:block">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <CalendarIcon className="w-5 h-5" />
                <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                <TicketIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Booking</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalBookings}</p>
                {stats.multiSegmentBookings > 0 && (
                  <p className="text-xs text-blue-600">{stats.multiSegmentBookings} multi segment</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-4">
                <CheckCircleIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Sudah Dibayar</p>
                <p className="text-2xl font-bold text-gray-800">{stats.paidBookings}</p>
                <p className="text-xs text-gray-500">{formatCurrency(stats.totalSpent)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center mr-4">
                <ClockIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Menunggu Bayar</p>
                <p className="text-2xl font-bold text-gray-800">{stats.pendingBookings}</p>
                <p className="text-xs text-gray-500">{formatCurrency(stats.pendingAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center mr-4">
                <XCircleIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Dibatalkan</p>
                <p className="text-2xl font-bold text-gray-800">{stats.cancelledBookings}</p>
                {stats.refundedBookings > 0 && (
                  <p className="text-xs text-green-600">{stats.refundedBookings} refund</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                <MapPinIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Multi Segment</p>
                <p className="text-2xl font-bold text-gray-800">{stats.multiSegmentBookings}</p>
                <p className="text-xs text-purple-600">Perjalanan terhubung</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari booking, penumpang, atau kereta..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-3 focus:ring-[#FD7E14]/30 focus:border-[#FD7E14] outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${activeFilter === 'all'
                  ? 'bg-[#FD7E14] text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Semua
              </button>
              <button
                onClick={() => handleFilterChange('paid')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${activeFilter === 'paid'
                  ? 'bg-[#FD7E14] text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Lunas
              </button>
              <button
                onClick={() => handleFilterChange('waiting')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${activeFilter === 'waiting'
                  ? 'bg-[#FD7E14] text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Menunggu
              </button>
              <button
                onClick={() => handleFilterChange('active')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${activeFilter === 'active'
                  ? 'bg-[#FD7E14] text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Aktif
              </button>
              <button
                onClick={() => handleFilterChange('cancelled')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${activeFilter === 'cancelled'
                  ? 'bg-[#FD7E14] text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Dibatalkan
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-gray-100">
            <Link
              href="/search/trains"
              className="px-5 py-3 bg-gradient-to-r from-[#FD7E14] to-orange-500 text-white rounded-xl hover:shadow-lg transition-all font-semibold flex items-center"
            >
              <TicketIcon className="w-5 h-5 mr-2" />
              Pesan Tiket Baru
            </Link>
            <button
              onClick={() => loadBookings(true)}
              className="px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold flex items-center"
            >
              <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
              Refresh Data
            </button>
            {!realtimeConnected && (
              <div className="flex items-center text-sm text-red-600">
                <ExclamationTriangleIcon className="w-5 h-5 mr-1" />
                Koneksi realtime terputus, refresh manual diperlukan
              </div>
            )}
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
            <TicketIcon className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-700 mb-4">
              {searchQuery ? 'Booking tidak ditemukan' : 'Belum Ada Booking'}
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {searchQuery
                ? 'Coba gunakan kata kunci lain atau reset filter pencarian'
                : 'Silakan lakukan pemesanan tiket kereta api terlebih dahulu'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    handleFilterChange('all');
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
                >
                  Reset Pencarian
                </button>
              )}
              <Link
                href="/search/trains"
                className="px-6 py-3 bg-[#FD7E14] text-white font-semibold rounded-xl hover:bg-orange-600 transition-all"
              >
                Pesan Tiket Sekarang
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {justPaidHighlight && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 mb-6">
                <div className="flex items-center">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3" />
                  <div className="flex-1">
                    <p className="font-semibold text-green-800">Pembayaran berhasil!</p>
                    <p className="text-green-600 text-sm">
                      Booking <strong>{justPaidHighlight}</strong> telah diproses.
                    </p>
                  </div>
                  <button
                    onClick={() => setJustPaidHighlight(null)}
                    className="text-green-500 hover:text-green-700"
                  >
                    <XCircleIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {filteredBookings.map((booking) => {
              const isPaid = booking.payment_status === 'paid';
              const isPending = booking.payment_status === 'pending';
              const isCancelled = booking.status === 'cancelled' || booking.status === 'canceled';
              const isMultiSegment = booking.is_multi_segment && booking.segments && booking.segments.length > 1;
              const segments = booking.segments || [{
                origin: booking.origin,
                destination: booking.destination,
                departure_date: booking.departure_date,
                departure_time: booking.departure_time,
                arrival_time: booking.arrival_time,
                train_code: booking.train_code,
                train_name: getTrainDisplayName(booking),
                train_class: booking.train_class || booking.train_type,
                train_type: booking.train_type,
                duration: booking.trip_duration || calculateTripDuration(booking.departure_time, booking.arrival_time),
                platform: booking.platform,
                seat_info: {
                  coach: booking.coach_number || '',
                  seat: booking.seat_numbers?.join(', ') || ''
                },
                segment_order: 1
              }];

              return (
                <div
                  key={`${booking.id}-${booking.updated_at}`}
                  className={`bg-white rounded-2xl shadow-xl overflow-hidden border-2 ${isCancelled ? 'border-red-200' :
                    isPaid ? 'border-green-200' :
                      isPending ? 'border-yellow-200' :
                        'border-gray-200'
                    }`}
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          {getStatusBadge(booking.status, booking.payment_status)}
                          <span className="text-sm font-mono font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">
                            {booking.booking_code}
                          </span>
                          {booking.ticket_number && (
                            <span className="text-sm text-blue-600 font-semibold bg-blue-50 px-3 py-1 rounded-lg">
                              {booking.ticket_number}
                            </span>
                          )}
                          {booking.pnr_number && (
                            <span className="text-sm text-purple-600 font-semibold bg-purple-50 px-3 py-1 rounded-lg">
                              PNR: {booking.pnr_number}
                            </span>
                          )}
                          {isMultiSegment && (
                            <span className="text-sm text-white font-semibold bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 rounded-lg">
                              MULTI SEGMENT
                            </span>
                          )}
                        </div>

                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          {getTrainDisplayName(booking)}
                          <span className="text-[#FD7E14] text-lg ml-2">
                            ({getTrainClassDisplay(booking.train_class, booking.train_type)})
                          </span>
                        </h3>

                        <div className="flex items-center text-gray-600">
                          <span className="font-semibold">{formatMultiSegmentInfo(booking)}</span>
                          {isMultiSegment && (
                            <span className="ml-4 text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded">
                              {booking.total_segments} segmen
                            </span>
                          )}
                          <span className="ml-4 text-sm bg-gray-100 px-2 py-1 rounded">
                            {booking.trip_duration || calculateTripDuration(booking.departure_time, booking.arrival_time)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#FD7E14]">
                          {formatCurrency(booking.final_amount || booking.total_amount)}
                        </div>
                        <p className="text-sm text-gray-500">
                          {booking.passenger_count} {booking.passenger_count > 1 ? 'penumpang' : 'penumpang'}
                        </p>
                        {booking.payment_method && (
                          <p className="text-sm text-gray-600 mt-1">
                            {booking.payment_method}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Multi Segment Details */}
                    {isMultiSegment && booking.segments && (
                      <div className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {booking.total_segments}
                          </div>
                          <span className="font-semibold text-purple-700">Detail Perjalanan Multi Segment</span>
                        </div>
                        
                        <div className="space-y-3">
                          {booking.segments.map((segment, idx) => {
                            const trainName = TRAIN_MAPPINGS[segment.train_code]?.name || segment.train_name;
                            return (
                              <div key={idx} className="bg-white rounded-lg p-3 border border-purple-100">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <div className="flex items-center">
                                      <span className="text-sm font-medium bg-purple-100 text-purple-700 px-2 py-1 rounded mr-2">
                                        Segmen {idx + 1}
                                      </span>
                                      <p className="text-sm font-medium text-gray-800">
                                        {segment.origin} → {segment.destination}
                                      </p>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">
                                      {trainName} ({getTrainClassDisplay(segment.train_class, segment.train_type)})
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-medium text-gray-800">
                                      {segment.departure_time} - {segment.arrival_time}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      {formatDateForTicket(segment.departure_date)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-700">
                                  <span>Durasi: {segment.duration}</span>
                                  {segment.seat_info && (
                                    <span className="font-semibold">
                                      Gerbong {segment.seat_info.coach} / Kursi {segment.seat_info.seat}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Journey Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center text-gray-600 mb-2">
                          <CalendarIcon className="w-5 h-5 mr-2 text-[#FD7E14]" />
                          <span className="font-medium">Tanggal</span>
                        </div>
                        <p className="font-semibold text-gray-800">
                          {formatDate(booking.departure_date)}
                        </p>
                        {booking.station_details?.origin && (
                          <p className="text-sm text-gray-600 mt-1">
                            {booking.station_details.origin.code} - {booking.station_details.origin.city}
                          </p>
                        )}
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center text-gray-600 mb-2">
                          <ClockIcon className="w-5 h-5 mr-2 text-[#FD7E14]" />
                          <span className="font-medium">Waktu</span>
                        </div>
                        <div className="flex items-center">
                          <div>
                            <p className="font-bold text-gray-800">{formatTime(booking.departure_time)}</p>
                            <p className="text-sm text-gray-600">{booking.origin}</p>
                          </div>
                          <ArrowRightIcon className="w-5 h-5 mx-4 text-[#FD7E14]" />
                          <div>
                            <p className="font-bold text-gray-800">{formatTime(booking.arrival_time)}</p>
                            <p className="text-sm text-gray-600">{booking.destination}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center text-gray-600 mb-2">
                          <UserIcon className="w-5 h-5 mr-2 text-[#FD7E14]" />
                          <span className="font-medium">Penumpang</span>
                        </div>
                        <p className="font-semibold text-gray-800">{booking.passenger_name}</p>
                        {booking.passenger_phone && (
                          <p className="text-sm text-gray-600">{booking.passenger_phone}</p>
                        )}
                        {booking.passenger_email && (
                          <p className="text-xs text-gray-500">{booking.passenger_email}</p>
                        )}
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center text-gray-600 mb-2">
                          <TicketIcon className="w-5 h-5 mr-2 text-[#FD7E14]" />
                          <span className="font-medium">Detail Kursi</span>
                        </div>
                        {isMultiSegment ? (
                          <div className="space-y-1">
                            {getAllSeatsInfo(booking).map((seatInfo, idx) => (
                              <div key={idx} className="text-sm text-gray-700">
                                <span className="font-medium">Segmen {seatInfo.segment}: </span>
                                <span>Gerbong {seatInfo.coach} / Kursi {seatInfo.seat}</span>
                              </div>
                            ))}
                          </div>
                        ) : booking.seat_numbers && booking.seat_numbers.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {booking.seat_numbers.map((seat, idx) => (
                              <span key={idx} className="px-2 py-1 bg-[#FD7E14] text-white text-sm rounded">
                                {seat}
                              </span>
                            ))}
                            {booking.coach_number && (
                              <p className="text-sm font-semibold text-gray-800 mt-1">Gerbong {booking.coach_number}</p>
                            )}
                          </div>
                        ) : booking.coach_number ? (
                          <p className="font-semibold text-gray-800">Gerbong {booking.coach_number}</p>
                        ) : (
                          <p className="text-sm text-gray-500">-</p>
                        )}
                        {booking.baggage_allowance && (
                          <p className="text-sm text-gray-600 mt-1">Bagasi: {booking.baggage_allowance}</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200">
                      {isPending && (
                        <>
                          <button
                            onClick={() => handleSendPaymentLink(booking.booking_code)}
                            className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-all flex items-center"
                          >
                            <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                            Bayar Sekarang
                          </button>
                          <button
                            onClick={() => handleUploadPaymentProof(booking.booking_code)}
                            disabled={uploadingProof === booking.booking_code}
                            className="px-4 py-2 border border-blue-500 text-blue-500 font-semibold rounded-lg hover:bg-blue-50 transition-all flex items-center"
                          >
                            {uploadingProof === booking.booking_code ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                                Mengunggah...
                              </>
                            ) : (
                              <>
                                <DocumentArrowUpIcon className="w-5 h-5 mr-2" />
                                Upload Bukti
                              </>
                            )}
                          </button>
                        </>
                      )}

                      {isPaid && (booking.ticket_number || booking.booking_code) && (
                        <>
                          <button
                            onClick={() => handlePrintTicket(booking)}
                            className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all flex items-center"
                          >
                            <PrinterIcon className="w-5 h-5 mr-2" />
                            Cetak Tiket (PDF)
                          </button>

                          {!booking.checkin_status && (
                            <button
                              onClick={() => handleCheckIn(booking.booking_code)}
                              className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-all"
                            >
                              Check-in
                            </button>
                          )}

                          <button
                            onClick={() => handleDownloadInvoice(booking)}
                            className="px-4 py-2 border border-purple-300 text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-all flex items-center"
                          >
                            <DocumentTextIcon className="w-5 h-5 mr-2" />
                            Invoice (PDF)
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => handleViewDetails(booking)}
                        className="px-4 py-2 border border-blue-500 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all flex items-center"
                      >
                        Lihat Detail Lengkap
                      </button>

                      {!isCancelled && !isPending && (
                        <button
                          onClick={() => handleCancelBooking(booking.booking_code)}
                          className="px-4 py-2 border border-red-300 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-all"
                        >
                          Batalkan
                        </button>
                      )}

                      <Link
                        href="/search/trains"
                        className="px-4 py-2 border border-gray-700 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                      >
                        Pesan Lagi
                      </Link>
                    </div>

                    {/* Additional Info */}
                    {(booking.insurance_amount || booking.convenience_fee || booking.discount_amount) && (
                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <p className="text-sm font-medium text-gray-700 mb-2">Rincian Biaya:</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {(booking.insurance_amount || 0) > 0 && (
                            <div className="text-sm text-gray-600">
                              <span>Asuransi: </span>
                              <span className="font-semibold">{formatCurrency(booking.insurance_amount || 0)}</span>
                            </div>
                          )}
                          {(booking.convenience_fee || 0) > 0 && (
                            <div className="text-sm text-gray-600">
                              <span>Biaya Layanan: </span>
                              <span className="font-semibold">{formatCurrency(booking.convenience_fee || 0)}</span>
                            </div>
                          )}
                          {(booking.discount_amount || 0) > 0 && (
                            <div className="text-sm text-green-600">
                              <span>Diskon: </span>
                              <span className="font-semibold">-{formatCurrency(booking.discount_amount || 0)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {booking.refund_amount && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-800">
                          Refund: {formatCurrency(booking.refund_amount)} ({booking.refund_status || 'processing'})
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detail Modal */}
        {selectedBookingForDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-800">Detail Booking</h3>
                <button
                  onClick={handleCloseDetails}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Booking Info */}
                  <div>
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                      <h4 className="font-bold text-gray-800 mb-4">Informasi Booking</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Kode Booking:</span>
                          <span className="font-semibold">{selectedBookingForDetails.booking_code}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Kode Tiket:</span>
                          <span className="font-semibold">{selectedBookingForDetails.ticket_number || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">PNR:</span>
                          <span className="font-semibold">{selectedBookingForDetails.pnr_number || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tanggal Booking:</span>
                          <span className="font-semibold">{formatDate(selectedBookingForDetails.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-bold text-gray-800 mb-4">Informasi Penumpang</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Nama:</span>
                          <span className="font-semibold">{selectedBookingForDetails.passenger_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-semibold">{selectedBookingForDetails.passenger_email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Telepon:</span>
                          <span className="font-semibold">{selectedBookingForDetails.passenger_phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Jumlah Penumpang:</span>
                          <span className="font-semibold">{selectedBookingForDetails.passenger_count}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Payment & Journey Info */}
                  <div>
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                      <h4 className="font-bold text-gray-800 mb-4">Informasi Pembayaran</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          {getStatusBadge(selectedBookingForDetails.status, selectedBookingForDetails.payment_status)}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Metode Pembayaran:</span>
                          <span className="font-semibold">{selectedBookingForDetails.payment_method || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Biaya:</span>
                          <span className="font-semibold text-[#FD7E14]">
                            {formatCurrency(selectedBookingForDetails.final_amount || selectedBookingForDetails.total_amount)}
                          </span>
                        </div>
                        {selectedBookingForDetails.transaction_id && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">ID Transaksi:</span>
                            <span className="font-semibold">{selectedBookingForDetails.transaction_id}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-bold text-gray-800 mb-4">Informasi Perjalanan</h4>
                      {selectedBookingForDetails.is_multi_segment && selectedBookingForDetails.segments ? (
                        <div className="space-y-4">
                          {selectedBookingForDetails.segments.map((segment, idx) => {
                            const trainName = TRAIN_MAPPINGS[segment.train_code]?.name || segment.train_name;
                            return (
                              <div key={idx} className="border border-gray-200 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-gray-700">Segmen {idx + 1}</span>
                                  <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                    {segment.duration}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-sm mb-1">
                                  <span className="font-semibold">{segment.origin}</span>
                                  <ChevronRightIcon className="w-4 h-4 mx-2" />
                                  <span className="font-semibold">{segment.destination}</span>
                                </div>
                                <div className="text-xs text-gray-600">
                                  {trainName} • {formatDateForTicket(segment.departure_date)} • {segment.departure_time} - {segment.arrival_time}
                                </div>
                                {segment.seat_info && (
                                  <div className="text-xs text-gray-700 mt-2">
                                    Gerbong: {segment.seat_info.coach} • Kursi: {segment.seat_info.seat}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Rute:</span>
                            <span className="font-semibold">{selectedBookingForDetails.origin} → {selectedBookingForDetails.destination}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tanggal:</span>
                            <span className="font-semibold">{formatDate(selectedBookingForDetails.departure_date)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Waktu:</span>
                            <span className="font-semibold">{selectedBookingForDetails.departure_time} - {selectedBookingForDetails.arrival_time}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Durasi:</span>
                            <span className="font-semibold">{selectedBookingForDetails.trip_duration || calculateTripDuration(selectedBookingForDetails.departure_time, selectedBookingForDetails.arrival_time)}</span>
                          </div>
                          {selectedBookingForDetails.seat_numbers && selectedBookingForDetails.seat_numbers.length > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Kursi:</span>
                              <span className="font-semibold">{selectedBookingForDetails.seat_numbers.join(', ')}</span>
                            </div>
                          )}
                          {selectedBookingForDetails.coach_number && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Gerbong:</span>
                              <span className="font-semibold">{selectedBookingForDetails.coach_number}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handlePrintTicket(selectedBookingForDetails)}
                      className="px-4 py-2 bg-[#FD7E14] text-white font-semibold rounded-lg hover:bg-orange-600 transition-all flex items-center"
                    >
                      <PrinterIcon className="w-5 h-5 mr-2" />
                      Cetak Tiket
                    </button>
                    <button
                      onClick={() => handleDownloadInvoice(selectedBookingForDetails)}
                      className="px-4 py-2 border border-blue-500 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all flex items-center"
                    >
                      <DocumentTextIcon className="w-5 h-5 mr-2" />
                      Download Invoice
                    </button>
                    <button
                      onClick={handleCloseDetails}
                      className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 p-8">
          <h3 className="font-bold text-2xl text-gray-800 mb-6 pb-4 border-b border-gray-200">Pertanyaan Umum</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <CheckCircleIcon className="w-6 h-6 text-blue-600" />
              </div>
              <p className="font-bold text-gray-700 mb-2">Bagaimana cara check-in?</p>
              <p className="text-gray-600 text-sm">
                Check-in online dapat dilakukan 2 jam sebelum keberangkatan. Datang ke stasiun minimal 30 menit sebelum keberangkatan.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-3">
                <XCircleIcon className="w-6 h-6 text-red-600" />
              </div>
              <p className="font-bold text-gray-700 mb-2">Bagaimana jika ingin membatalkan?</p>
              <p className="text-gray-600 text-sm">
                Pembatalan dapat dilakukan melalui tombol "Batalkan". Refund 80% untuk pembatalan 24 jam sebelum keberangkatan.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                <TicketIcon className="w-6 h-6 text-green-600" />
              </div>
              <p className="font-bold text-gray-700 mb-2">Kapan e-ticket dikirim?</p>
              <p className="text-gray-600 text-sm">
                E-ticket dikirim ke email setelah pembayaran berhasil. Cek folder spam jika tidak menerima dalam 5 menit.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-bold text-gray-800">Butuh bantuan lebih lanjut?</p>
                <p className="text-gray-600 text-sm">Tim customer service kami siap membantu 24/7</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href="tel:1500123"
                  className="px-4 py-2 bg-[#FD7E14] text-white font-semibold rounded-lg hover:bg-orange-600 transition-all"
                >
                  📞 1500-123
                </a>
                <a
                  href="mailto:help@tripgo.com"
                  className="px-4 py-2 border border-gray-700 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                >
                  ✉️ Email Kami
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}