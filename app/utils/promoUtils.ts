import { supabase } from '@/app/lib/supabaseClient';

interface ApplyPromoParams {
  promoCode: string;
  userId: string;
  orderAmount: number;
  serviceIds?: string[];
}

export async function validateAndApplyPromo({
  promoCode,
  userId,
  orderAmount,
  serviceIds
}: ApplyPromoParams) {
  try {
    // 1. Cari promo berdasarkan kode
    const { data: promo, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('promo_code', promoCode.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !promo) {
      return { valid: false, message: 'Kode promo tidak valid' };
    }

    const now = new Date();
    const startDate = new Date(promo.start_date);
    const endDate = new Date(promo.end_date);

    // 2. Cek tanggal
    if (now < startDate) {
      return { valid: false, message: 'Promo belum mulai' };
    }

    if (now > endDate) {
      return { valid: false, message: 'Promo sudah kadaluarsa' };
    }

    // 3. Cek minimum order
    if (orderAmount < promo.min_order_amount) {
      return { 
        valid: false, 
        message: `Minimum order Rp${promo.min_order_amount.toLocaleString('id-ID')}` 
      };
    }

    // 4. Cek usage limit
    if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
      return { valid: false, message: 'Kuota promo telah habis' };
    }

    // 5. Cek user limit
    const { count: userUsage } = await supabase
      .from('user_promo_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('promotion_id', promo.id);

    if (userUsage && userUsage >= promo.user_limit) {
      return { valid: false, message: 'Anda telah menggunakan promo ini' };
    }

    // 6. Cek applicable services
    if (!promo.applicable_to?.all && serviceIds) {
      const applicableServices = promo.applicable_to?.specific_services || [];
      const hasApplicableService = serviceIds.some(id => 
        applicableServices.includes(id)
      );
      if (!hasApplicableService) {
        return { valid: false, message: 'Promo tidak berlaku untuk layanan ini' };
      }
    }

    // 7. Hitung diskon
    let discountAmount = 0;
    
    if (promo.discount_type === 'percentage') {
      discountAmount = orderAmount * (promo.discount_value / 100);
      
      if (promo.max_discount_amount && discountAmount > promo.max_discount_amount) {
        discountAmount = promo.max_discount_amount;
      }
    } else if (promo.discount_type === 'fixed_amount') {
      discountAmount = Math.min(promo.discount_value, orderAmount);
    }

    // 8. Return success
    return {
      valid: true,
      discountAmount,
      promoId: promo.id,
      promoName: promo.name,
      finalAmount: orderAmount - discountAmount
    };
  } catch (error) {
    console.error('Error validating promo:', error);
    return { valid: false, message: 'Terjadi kesalahan saat validasi promo' };
  }
}

export async function recordPromoUsage(
  userId: string,
  promoId: string,
  bookingId: string,
  discountApplied: number
) {
  try {
    // 1. Record usage
    await supabase
      .from('user_promo_usage')
      .insert([{
        user_id: userId,
        promotion_id: promoId,
        booking_id: bookingId,
        discount_applied: discountApplied
      }]);

    // 2. Update promo usage count
    await supabase.rpc('increment_promo_usage', { promo_id: promoId });

    return { success: true };
  } catch (error) {
    console.error('Error recording promo usage:', error);
    return { success: false, error };
  }
}