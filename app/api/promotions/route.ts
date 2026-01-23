import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const trainType = searchParams.get('trainType');
    const totalPrice = parseFloat(searchParams.get('totalPrice') || '0');
    const passengerCount = parseInt(searchParams.get('passengerCount') || '1');

    const today = new Date().toISOString();

    // Query dasar untuk promo yang aktif
    let query = supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', today)
      .gte('end_date', today);

    // Filter berdasarkan minimum order amount
    if (totalPrice > 0) {
      query = query.lte('min_order_amount', totalPrice);
    }

    const { data: promotions, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Database error',
          message: error.message
        },
        { status: 500 }
      );
    }

    if (!promotions || promotions.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Tidak ada promo yang tersedia'
      });
    }

    // Filter tambahan berdasarkan kriteria
    const filteredPromotions = promotions.filter(promo => {
      // Filter berdasarkan usage limit
      if (promo.usage_limit && promo.usage_limit > 0) {
        if (promo.usage_count >= promo.usage_limit) {
          return false;
        }
      }

      // Filter berdasarkan train type jika ada
      if (trainType && promo.applicable_to && promo.applicable_to.length > 0) {
        if (!promo.applicable_to.includes(trainType)) {
          return false;
        }
      }

      // Filter khusus untuk promo keluarga
      if (promo.promo_code === 'FAMILY30' && passengerCount < 3) {
        return false;
      }

      return true;
    });

    // Normalize applicable_to field to ensure it's always an array or null
    const normalizedPromotions = filteredPromotions.map(promo => ({
      ...promo,
      applicable_to: Array.isArray(promo.applicable_to)
        ? promo.applicable_to
        : (promo.applicable_to ? [promo.applicable_to] : null)
    }));

    return NextResponse.json({
      success: true,
      data: normalizedPromotions,
      count: normalizedPromotions.length
    });

  } catch (error: any) {
    console.error('Error in promotions API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error.message
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { promoCode, totalPrice, trainType, passengerCount, departureDate } = body;

    if (!promoCode) {
      return NextResponse.json(
        { success: false, isValid: false, message: 'Kode promo diperlukan' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString();

    // Cari promo berdasarkan kode
    const { data: promotions, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('promo_code', promoCode.toUpperCase())
      .eq('is_active', true)
      .limit(1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        {
          success: false,
          isValid: false,
          message: 'Gagal memvalidasi promo'
        },
        { status: 500 }
      );
    }

    if (!promotions || promotions.length === 0) {
      return NextResponse.json({
        success: true,
        isValid: false,
        message: 'Kode promo/voucher tidak ditemukan'
      });
    }

    const promo = promotions[0];

    // Validasi tanggal
    const startDate = new Date(promo.start_date);
    const endDate = new Date(promo.end_date);
    const currentDate = new Date();

    if (currentDate < startDate) {
      return NextResponse.json({
        success: true,
        isValid: false,
        message: `Promo akan berlaku mulai ${formatDate(promo.start_date)}`
      });
    }

    if (currentDate > endDate) {
      return NextResponse.json({
        success: true,
        isValid: false,
        message: 'Promo/voucher telah kadaluarsa'
      });
    }

    // Validasi usage limit
    if (promo.usage_limit > 0 && promo.usage_count >= promo.usage_limit) {
      return NextResponse.json({
        success: true,
        isValid: false,
        message: 'Kuota promo/voucher telah habis'
      });
    }

    // Validasi minimum order amount
    if (totalPrice < promo.min_order_amount) {
      return NextResponse.json({
        success: true,
        isValid: false,
        message: `Minimal pembelian Rp ${promo.min_order_amount.toLocaleString('id-ID')}`
      });
    }

    // Validasi train type
    if (trainType && promo.applicable_to && promo.applicable_to.length > 0) {
      if (!promo.applicable_to.includes(trainType)) {
        return NextResponse.json({
          success: true,
          isValid: false,
          message: `Promo tidak berlaku untuk kelas ${trainType}`
        });
      }
    }

    // Validasi khusus untuk promo keluarga
    if (promo.promo_code === 'FAMILY30' && passengerCount < 3) {
      return NextResponse.json({
        success: true,
        isValid: false,
        message: 'Promo keluarga berlaku untuk minimal 3 penumpang'
      });
    }

    // Hitung diskon
    let discountAmount = 0;

    if (promo.discount_type === 'percentage') {
      discountAmount = totalPrice * (promo.discount_value / 100);
      if (promo.max_discount_amount > 0 && discountAmount > promo.max_discount_amount) {
        discountAmount = promo.max_discount_amount;
      }
    } else if (promo.discount_type === 'fixed') {
      discountAmount = promo.discount_value;
    }

    // Normalize applicable_to field
    const normalizedPromo = {
      ...promo,
      applicable_to: Array.isArray(promo.applicable_to)
        ? promo.applicable_to
        : (promo.applicable_to ? [promo.applicable_to] : null)
    };

    return NextResponse.json({
      success: true,
      isValid: true,
      promo: normalizedPromo,
      discountAmount,
      message: `Promo/voucher berhasil diterapkan! Diskon: Rp ${discountAmount.toLocaleString('id-ID')}`
    });

  } catch (error: any) {
    console.error('Error validating promo code:', error);
    return NextResponse.json(
      {
        success: false,
        isValid: false,
        message: 'Terjadi kesalahan saat validasi promo'
      },
      { status: 500 }
    );
  }
}

// Fungsi helper untuk format tanggal
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}