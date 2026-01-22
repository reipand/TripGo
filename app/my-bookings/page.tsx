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
  TrashIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  QrCodeIcon,
  ExclamationTriangleIcon,
  DocumentArrowUpIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/app/lib/supabaseClient';
import { useAuth } from '@/app/contexts/AuthContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import 'jspdf-autotable';

// Update interface Booking sesuai dengan API terbaru
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
}

type FilterStatus = 'all' | 'paid' | 'waiting' | 'active' | 'completed' | 'cancelled' | 'refunded';

// Fungsi untuk memvalidasi dan membersihkan data booking
const validateAndCleanBooking = (data: any): Booking | null => {
  try {
    if (!data) return null;

    return {
      id: data.id || `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      booking_code: data.booking_code || data.bookingCode || `BOOK-${Date.now().toString().slice(-8)}`,
      order_id: data.order_id || data.orderId || `ORDER-${Date.now()}`,
      ticket_number: data.ticket_number || data.ticketNumber,
      passenger_name: data.passenger_name || data.passengerName || data.customerName || 'Penumpang',
      passenger_email: data.passenger_email || data.passengerEmail || data.customerEmail || '',
      passenger_phone: data.passenger_phone || data.passengerPhone || data.customerPhone || '',
      train_name: data.train_name || data.trainName || 'Kereta Api',
      train_code: data.train_code || data.trainCode,
      train_class: data.train_class || data.trainClass,
      train_type: data.train_type || data.trainType || 'Economy',
      origin: data.origin || '',
      destination: data.destination || '',
      departure_date: data.departure_date || data.departureDate || new Date().toISOString().split('T')[0],
      departure_time: data.departure_time || data.departureTime || '08:00',
      arrival_time: data.arrival_time || data.arrivalTime || '12:00',
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
      operator: data.operator,
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
      refund_status: data.refund_status
    };
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
  if (booking.train_name && booking.train_name !== 'Kereta Api' && booking.train_name !== 'Train') {
    return booking.train_name;
  }
  
  if (booking.train_code) {
    const code = booking.train_code.toUpperCase();
    
    const trainMappings: Record<string, string> = {
      'KA-01': 'Argo Wilis',
      'KA-02': 'Argo Parahyangan',
      'KA-03': 'Turangga',
      'KA-04': 'Sancaka',
      'KA-05': 'Mutiara Selatan',
      'KA-06': 'Mutiara Timur',
      'KA-07': 'Taksaka',
      'KA-08': 'Bima',
      'KA-09': 'Gajayana',
      'KA-10': 'Sembrani',
      'KA-11': 'Bangunkarta',
      'KA-12': 'Fajar/Senja Utama',
      'KA-13': 'Sribilah',
      'KA-14': 'Serelo',
      'KA-15': 'Rajawali',
      'KA-16': 'Tegar',
      'KA-17': 'Harina',
      'KA-18': 'Pangrango',
      'KA-19': 'Gajah Wong',
      'KA-20': 'Jaka Tingkir',
    };
    
    if (trainMappings[code]) {
      return trainMappings[code];
    }
    
    return `Kereta ${code}`;
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
      'business_premium': 'Bisnis Premium'
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

// Fungsi untuk mendapatkan operator kereta
const getTrainOperator = (trainName: string): string => {
  const operators: Record<string, string> = {
    'Argo Parahyangan': 'PT. Kereta Api Indonesia (KAI)',
    'Argo Wilis': 'PT. Kereta Api Indonesia (KAI)',
    'Turangga': 'PT. Kereta Api Indonesia (KAI)',
    'Sancaka': 'PT. Kereta Api Indonesia (KAI)',
    'Mutiara Selatan': 'PT. Kereta Api Indonesia (KAI)',
    'Taksaka': 'PT. Kereta Api Indonesia (KAI)',
    'Gajayana': 'PT. Kereta Api Indonesia (KAI)',
    'Sembrani': 'PT. Kereta Api Indonesia (KAI)',
    'Bima': 'PT. Kereta Api Indonesia (KAI)',
    'Bangunkarta': 'PT. Kereta Api Indonesia (KAI)',
    'Lodaya': 'PT. Kereta Api Indonesia (KAI)',
    'Malabar': 'PT. Kereta Api Indonesia (KAI)',
  };
  
  return operators[trainName] || 'PT. Kereta Api Indonesia (KAI)';
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

// Fungsi untuk generate QR code URL dari goqr.me
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
    
    // Format: "17 Januari 2026 | 02.40.48"
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
    
    // Logo dan Header - Warna orange dari TripGo
    doc.setFillColor(253, 126, 20); // #FD7E14
    doc.rect(0, 0, 210, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('TRIPGO', 105, 12, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('RAILWAY SERVICES', 105, 18, { align: 'center' });
    
    // Invoice Title
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 105, 35, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Official Railway Ticket Invoice', 105, 42, { align: 'center' });
    
    // Garis pemisah tipis
    doc.setDrawColor(220, 220, 220);
    doc.line(15, 48, 195, 48);
    
    // Bill To Section - Seperti di screenshot
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('BILL TO (PASSENGER):', 15, 58);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(booking.passenger_name || 'Penumpang', 15, 65);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Type:', 15, 72);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Train Passenger', 15, 79);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Server:', 15, 86);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('railway.tripgo.id', 15, 93);
    
    // Payment Date dan Transaction ID - Di sebelah kanan
    const paymentDate = booking.created_at || new Date().toISOString();
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Payment Date:', 115, 58);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(formatDateForInvoice(paymentDate), 115, 65);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Transaction ID:', 115, 72);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(booking.transaction_id || booking.booking_code || `TRX${Date.now().toString().slice(-6)}`, 115, 79);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Status:', 115, 86);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const isPaid = booking.payment_status === 'paid' || booking.status === 'confirmed';
    doc.setTextColor(isPaid ? [0, 150, 0] : [200, 0, 0]); // Hijau untuk LUNAS, merah untuk pending
    doc.text(isPaid ? 'LUNAS' : 'PENDING', 115, 93);
    
    // Garis pemisah sebelum product description
    doc.setDrawColor(220, 220, 220);
    doc.line(15, 100, 195, 100);
    
    // PRODUCT DESCRIPTION Header - seperti di screenshot
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.text('PRODUCT DESCRIPTION', 15, 110);
    
    // Train Details dengan bracket seperti di screenshot
    const trainName = getTrainDisplayName(booking);
    const trainClass = getTrainClassDisplay(booking.train_class, booking.train_type);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text(`[ ${trainName} - ${trainClass} ] Railway Ticket`, 15, 120);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Digital ticket successfully delivered to passenger.', 15, 127);
    
    // Table for ticket details - seperti di screenshot
    const tableData = [
      [
        {
          content: `Train Ticket: ${booking.origin} to ${booking.destination}\n${formatDateForInvoice(booking.departure_date)}`,
          styles: { cellPadding: { top: 8, right: 5, bottom: 8, left: 5 } }
        },
        {
          content: booking.passenger_count.toString(),
          styles: { halign: 'center', cellPadding: { top: 8, right: 5, bottom: 8, left: 5 } }
        },
        {
          content: formatCurrencyForPDF(Math.round((booking.total_amount || 0) / booking.passenger_count)),
          styles: { halign: 'right', cellPadding: { top: 8, right: 5, bottom: 8, left: 5 } }
        },
        {
          content: formatCurrencyForPDF(booking.total_amount || 0),
          styles: { halign: 'right', cellPadding: { top: 8, right: 5, bottom: 8, left: 5 } }
        }
      ]
    ];
    
    autoTable(doc, {
      startY: 135,
      head: [[
        { content: 'Description', styles: { halign: 'left', fontStyle: 'bold', fillColor: [253, 126, 20] } },
        { content: 'QTY', styles: { halign: 'center', fontStyle: 'bold', fillColor: [253, 126, 20] } },
        { content: 'Unit Price', styles: { halign: 'right', fontStyle: 'bold', fillColor: [253, 126, 20] } },
        { content: 'Amount', styles: { halign: 'right', fontStyle: 'bold', fillColor: [253, 126, 20] } }
      ]],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [253, 126, 20], // Orange header
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11,
        cellPadding: { top: 5, right: 5, bottom: 5, left: 5 }
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: { top: 8, right: 5, bottom: 8, left: 5 }
      },
      styles: {
        lineWidth: 0.1,
        lineColor: [200, 200, 200]
      },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 20 },
        2: { cellWidth: 35 },
        3: { cellWidth: 35 }
      },
      margin: { left: 15, right: 15 }
    });
    
    // Get final Y position after table
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    
    // Price breakdown - di sebelah kanan seperti di screenshot
    // Hitung harga asli berdasarkan contoh di screenshot
    const basePrice = booking.total_amount || 0;
    const convenienceFee = booking.convenience_fee || 5000; // Default 5,000 seperti di screenshot
    const insuranceAmount = booking.insurance_amount || 10000; // Default 10,000 seperti di screenshot
    const discountAmount = booking.discount_amount || 0;
    
    // Original Item Price - ini yang perlu dihitung mundur dari Grand Total
    const grandTotal = booking.final_amount || booking.total_amount || 0;
    const originalItemPrice = grandTotal - convenienceFee - insuranceAmount + discountAmount;
    
    let yOffset = finalY + 15;
    
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text('Original Item Price:', 125, yOffset);
    doc.text(formatCurrencyForPDF(originalItemPrice), 175, yOffset, { align: 'right' });
    
    yOffset += 7;
    
    if (convenienceFee > 0) {
      doc.text('Convenience Fee:', 125, yOffset);
      doc.text(formatCurrencyForPDF(convenienceFee), 175, yOffset, { align: 'right' });
      yOffset += 7;
    }
    
    if (insuranceAmount > 0) {
      doc.text('Insurance:', 125, yOffset);
      doc.text(formatCurrencyForPDF(insuranceAmount), 175, yOffset, { align: 'right' });
      yOffset += 7;
    }
    
    if (discountAmount > 0) {
      doc.text('General Discount:', 125, yOffset);
      doc.text(`-${formatCurrencyForPDF(discountAmount)}`, 175, yOffset, { align: 'right' });
      yOffset += 7;
    }
    
    // Garis untuk total
    doc.setDrawColor(200, 200, 200);
    doc.line(125, yOffset + 3, 190, yOffset + 3);
    yOffset += 6;
    
    // Grand Total - seperti di screenshot
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text('Grand Total:', 125, yOffset);
    
    doc.setFontSize(16);
    doc.setTextColor(253, 126, 20); // Orange untuk total
    doc.text(formatCurrencyForPDF(grandTotal), 175, yOffset, { align: 'right' });
    
    // Footer - sama seperti di screenshot
    const footerY = Math.max(yOffset + 20, 250);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for choosing TripGO Railway Services!', 105, footerY, { align: 'center' });
    
    doc.setFontSize(9);
    doc.text('Website: railway.tripgo.id | Need help? Contact us on Discord.', 105, footerY + 7, { align: 'center' });
    
    // Tambah watermark "PAID" jika sudah lunas
    if (isPaid) {
      doc.setFontSize(80);
      doc.setTextColor(240, 240, 240);
      doc.setFont('helvetica', 'bold');
      doc.text('PAID', 105, 140, { align: 'center', angle: 45 });
    }
    
    // Save PDF dengan nama yang sesuai
    const fileName = `Invoice-${booking.booking_code}-${Date.now().toString().slice(-6)}.pdf`;
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

// Fungsi untuk download PDF Ticket dengan QR code
const downloadTicketPDF = async (booking: Booking) => {
  try {
    const doc = new jsPDF();
    
    // Header dengan warna orange
    doc.setFillColor(253, 126, 20);
    doc.rect(0, 0, 210, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('TRIPGO E-TICKET', 105, 18, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text('Official Digital Railway Ticket', 105, 25, { align: 'center' });
    
    // Ticket Details
    let yPosition = 45;
    
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
    
    // Train Info Box
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(20, yPosition, 170, 30, 3, 3, 'F');
    
    const trainName = getTrainDisplayName(booking);
    const trainClass = getTrainClassDisplay(booking.train_class, booking.train_type);
    
    doc.setFontSize(12);
    doc.setTextColor(253, 126, 20);
    doc.text(trainName, 25, yPosition + 10);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`${trainClass} Class`, 25, yPosition + 17);
    
    // Route with arrow
    const routeY = yPosition + 10;
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text(booking.origin, 100, routeY, { align: 'center' });
    
    doc.setTextColor(253, 126, 20);
    doc.text('→', 115, routeY);
    
    doc.setTextColor(40, 40, 40);
    doc.text(booking.destination, 140, routeY, { align: 'center' });
    
    yPosition += 40;
    
    // Journey Details in table
    autoTable(doc, {
      startY: yPosition,
      head: [['Departure', 'Arrival', 'Date', 'Duration', 'Seats']],
      body: [[
        booking.departure_time,
        booking.arrival_time,
        formatDateForTicket(booking.departure_date),
        booking.trip_duration || calculateTripDuration(booking.departure_time, booking.arrival_time),
        booking.seat_numbers?.join(', ') || (booking.coach_number ? `Coach ${booking.coach_number}` : 'N/A')
      ]],
      theme: 'grid',
      headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255] },
      styles: { fontSize: 10, cellPadding: 5 },
      margin: { left: 20, right: 20 }
    });
    
    const tableY = (doc as any).lastAutoTable.finalY || yPosition + 30;
    
    // QR Code
    try {
      // Generate QR data
      const qrData = JSON.stringify({
        booking_code: booking.booking_code,
        ticket_number: booking.ticket_number || booking.booking_code,
        passenger_name: booking.passenger_name,
        train: trainName,
        class: trainClass,
        route: `${booking.origin} to ${booking.destination}`,
        date: booking.departure_date,
        time: booking.departure_time,
        seats: booking.seat_numbers || [],
        coach: booking.coach_number || '',
        pnr: booking.pnr_number || ''
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
        doc.text('Scan for verification', 165, tableY + 55, { align: 'center' });
        
        // Additional Info
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`PNR: ${booking.pnr_number || 'N/A'} | Coach: ${booking.coach_number || 'N/A'}`, 20, tableY + 60);
        doc.text(`Baggage: ${booking.baggage_allowance || '20kg'} | Platform: ${booking.platform || 'Digital'}`, 20, tableY + 67);
        
        // Terms and Conditions
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        const terms = [
          '• This is an official e-ticket. No physical copy required.',
          '• Please arrive at station 30 minutes before departure.',
          '• Valid government ID required for verification.',
          '• Ticket is non-transferable.',
          '• For assistance, contact: help@railway.tripgo.id'
        ];
        
        terms.forEach((term, index) => {
          doc.text(term, 20, tableY + 80 + (index * 4));
        });
        
        // Save the PDF
        doc.save(`Ticket-${booking.booking_code}.pdf`);
      };
      
      reader.readAsDataURL(blob);
      
    } catch (qrError) {
      console.error('Error loading QR code:', qrError);
      // Jika QR gagal, tetap save PDF tanpa QR
      doc.setFontSize(10);
      doc.setTextColor(200, 0, 0);
      doc.text('QR Code not available', 165, tableY + 30, { align: 'center' });
      
      // Continue with other content
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`PNR: ${booking.pnr_number || 'N/A'} | Coach: ${booking.coach_number || 'N/A'}`, 20, tableY + 60);
      
      // Save the PDF
      doc.save(`Ticket-${booking.booking_code}.pdf`);
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
  const [trainDetails, setTrainDetails] = useState<Record<string, { name: string; operator: string }>>({});
  const [error, setError] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState<string | null>(null);
  
  const isLoadingRef = useRef(false);
  const initialLoadDone = useRef(false);

  // Check URL parameters
  useEffect(() => {
    const justPaidFromUrl = searchParams.get('justPaid');
    const bookingCodeFromUrl = searchParams.get('bookingCode');
    
    if (justPaidFromUrl === 'true' && bookingCodeFromUrl) {
      setJustPaidHighlight(bookingCodeFromUrl);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

  // Load bookings dengan API yang terupdate
  const loadBookings = useCallback(async (forceReload = false) => {
    if (isLoadingRef.current && !forceReload) {
      return;
    }
    
    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);
      
      let allBookings: Booking[] = [];
      const trainCodes: string[] = [];
      
      // 1. Load from localStorage first
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
      
      // 2. Load from database with updated API
      if (user?.id) {
        try {
          // Coba load dari tabel bookings_kereta terlebih dahulu
          const { data: dbBookings, error: bookingsError } = await supabase
            .from('bookings_kereta')
            .select('*')
            .or(`user_id.eq.${user.id},passenger_email.eq.${user.email}`)
            .order('created_at', { ascending: false });
          
          if (!bookingsError && dbBookings) {
            const validDbBookings = dbBookings
              .map(validateAndCleanBooking)
              .filter((b): b is Booking => b !== null);
            
            // Merge dan hindari duplikat
            const existingCodes = allBookings.map(b => b.booking_code);
            const uniqueDbBookings = validDbBookings.filter(
              (b: Booking) => !existingCodes.includes(b.booking_code)
            );
            
            allBookings = [...allBookings, ...uniqueDbBookings];
          }
          
          // Coba load dari tabel transactions jika ada
          const { data: transactions, error: transactionsError } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .eq('type', 'train')
            .order('created_at', { ascending: false });
          
          if (!transactionsError && transactions) {
            const transactionBookings = transactions.map(transaction => {
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
            
            // Merge bookings dari transactions
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
      
      // 3. Load dari session storage untuk pembayaran baru
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
        
        // Load latest booking
        const latestBooking = localStorage.getItem('latestBooking');
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
            localStorage.removeItem('latestBooking');
          } catch (parseError) {
            console.error('Error parsing latest booking:', parseError);
            localStorage.removeItem('latestBooking');
          }
        }
      } catch (sessionError) {
        console.error('Session storage error:', sessionError);
      }
      
      // 4. Tambah demo data jika kosong
      if (allBookings.length === 0) {
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
            total_amount: 412500,
            status: 'confirmed',
            payment_status: 'paid',
            payment_method: 'E-WALLET',
            passenger_count: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            selected_seats: ['C2'],
            has_ticket: true,
            booking_date: new Date().toISOString(),
            pnr_number: 'PNR123456',
            coach_number: 'C2',
            seat_numbers: ['C2'],
            transaction_id: 'TRX001',
            checkin_status: false,
            baggage_allowance: '20kg',
            trip_duration: '5j 0m',
            platform: 'web',
            is_insurance_included: true,
            insurance_amount: 10000,
            convenience_fee: 5000,
            discount_amount: 0,
            final_amount: 412500
          },
          {
            id: 'demo-2',
            booking_code: 'BOOK-012000-EBS0',
            order_id: 'ORDER-1767536012000-EBS0',
            ticket_number: 'TICKET-36149124',
            passenger_name: 'John Doe',
            passenger_email: 'john@example.com',
            passenger_phone: '08453535345',
            train_name: 'Argo Wilis',
            train_code: 'KA-01',
            train_class: 'Economy',
            train_type: 'Economy',
            origin: 'Stasiun Bandung',
            destination: 'Stasiun Gambir',
            departure_date: today.toISOString().split('T')[0],
            departure_time: '06:35',
            arrival_time: '11:35',
            total_amount: 149825,
            status: 'pending',
            payment_status: 'pending',
            payment_method: null,
            passenger_count: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            selected_seats: ['A1'],
            has_ticket: false,
            booking_date: new Date().toISOString(),
            pnr_number: 'PNR789012',
            coach_number: 'A1',
            seat_numbers: ['A1'],
            transaction_id: null,
            checkin_status: false,
            baggage_allowance: '15kg',
            trip_duration: '5j 0m',
            platform: 'mobile',
            is_insurance_included: false,
            insurance_amount: 0,
            convenience_fee: 3000,
            discount_amount: 5000,
            final_amount: 144825
          }
        ];
        
        allBookings = [...allBookings, ...demoBookings];
      }
      
      // 5. Sort bookings
      allBookings.sort((a, b) => {
        const dateA = new Date(a.departure_date);
        const dateB = new Date(b.departure_date);
        return dateA.getTime() - dateB.getTime();
      });
      
      // 6. Update state
      setBookings(allBookings);
      applyFilter(activeFilter, allBookings);
      
      // 7. Simpan ke localStorage
      try {
        localStorage.setItem('myBookings', JSON.stringify(allBookings));
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
      
    } catch (error: any) {
      console.error('Error loading bookings:', error);
      setError('Gagal memuat data booking. Silakan refresh halaman.');
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
      (booking.pnr_number?.toLowerCase() || '').includes(query)
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
  const handleViewDetails = useCallback((bookingCode: string) => {
    router.push(`/booking/detail/${bookingCode}`);
  }, [router]);

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
    input.accept = 'image/*,.pdf';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File terlalu besar. Maksimal 5MB');
        return;
      }
      
      try {
        setUploadingProof(bookingCode);
        
        // Simulate upload (in real app, upload to server)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update booking with payment proof
        const updatedBookings = bookings.map(b => {
          if (b.booking_code === bookingCode) {
            return {
              ...b,
              payment_proof: URL.createObjectURL(file),
              updated_at: new Date().toISOString()
            };
          }
          return b;
        });
        
        setBookings(updatedBookings);
        applyFilter(activeFilter, updatedBookings);
        
        // Save to localStorage
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
      
      // Update booking in database if exists
      if (bookingToCancel.id && !bookingToCancel.id.startsWith('demo-')) {
        try {
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
          }
        } catch (dbError) {
          console.error('Error updating database:', dbError);
        }
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
      
      // Save to localStorage
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
      
      // Update check-in status
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
      
      // Save to localStorage
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
      
      // Update payment status to paid after "payment"
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
      
      // Save to localStorage
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
      totalSpent, 
      pendingAmount 
    };
  }, [bookings]);

  // Load data on mount
  useEffect(() => {
    if (!initialLoadDone.current) {
      loadBookings();
    }
    
    return () => {
      isLoadingRef.current = false;
    };
  }, [loadBookings]);

  // Loading state
  if (loading && bookings.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FD7E14] mx-auto mb-6"></div>
          <p className="text-gray-600 font-medium">Memuat data booking...</p>
          <button
            onClick={() => window.location.reload()}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                <TicketIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Booking</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalBookings}</p>
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
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeFilter === 'all'
                    ? 'bg-[#FD7E14] text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => handleFilterChange('paid')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeFilter === 'paid'
                    ? 'bg-[#FD7E14] text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Lunas
              </button>
              <button
                onClick={() => handleFilterChange('waiting')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeFilter === 'waiting'
                    ? 'bg-[#FD7E14] text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Menunggu
              </button>
              <button
                onClick={() => handleFilterChange('active')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeFilter === 'active'
                    ? 'bg-[#FD7E14] text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Aktif
              </button>
              <button
                onClick={() => handleFilterChange('cancelled')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeFilter === 'cancelled'
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
              const tripDuration = booking.trip_duration || calculateTripDuration(booking.departure_time, booking.arrival_time);
              
              return (
                <div
                  key={`${booking.id}-${booking.updated_at}`}
                  className={`bg-white rounded-2xl shadow-xl overflow-hidden border-2 ${
                    isCancelled ? 'border-red-200' :
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
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          {getTrainDisplayName(booking)} 
                          <span className="text-[#FD7E14] text-lg ml-2">
                            ({getTrainClassDisplay(booking.train_class, booking.train_type)})
                          </span>
                        </h3>
                        
                        <div className="flex items-center text-gray-600">
                          <span className="font-semibold">{booking.origin}</span>
                          <ArrowRightIcon className="w-4 h-4 mx-2" />
                          <span className="font-semibold">{booking.destination}</span>
                          <span className="ml-4 text-sm bg-gray-100 px-2 py-1 rounded">
                            {tripDuration}
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
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center text-gray-600 mb-2">
                          <TicketIcon className="w-5 h-5 mr-2 text-[#FD7E14]" />
                          <span className="font-medium">Detail Kursi</span>
                        </div>
                        {booking.seat_numbers && booking.seat_numbers.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {booking.seat_numbers.map((seat, idx) => (
                              <span key={idx} className="px-2 py-1 bg-[#FD7E14] text-white text-sm rounded">
                                {seat}
                              </span>
                            ))}
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
                        onClick={() => handleViewDetails(booking.booking_code)}
                        className="px-4 py-2 border border-blue-500 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all"
                      >
                        Lihat Detail
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
                          {booking.insurance_amount > 0 && (
                            <div className="text-sm text-gray-600">
                              <span>Asuransi: </span>
                              <span className="font-semibold">{formatCurrency(booking.insurance_amount)}</span>
                            </div>
                          )}
                          {booking.convenience_fee > 0 && (
                            <div className="text-sm text-gray-600">
                              <span>Biaya Layanan: </span>
                              <span className="font-semibold">{formatCurrency(booking.convenience_fee)}</span>
                            </div>
                          )}
                          {booking.discount_amount > 0 && (
                            <div className="text-sm text-green-600">
                              <span>Diskon: </span>
                              <span className="font-semibold">-{formatCurrency(booking.discount_amount)}</span>
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