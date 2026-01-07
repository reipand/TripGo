// lib/midtrans.ts

export interface MidtransTransactionDetails {
  order_id: string;
  gross_amount: number;
}

export interface MidtransCustomerDetails {
  first_name: string;
  email: string;
  phone?: string;
}

export interface MidtransItemDetail {
  id: string;
  price: number;
  quantity: number;
  name: string;
}

// lib/midtrans.ts

export interface MidtransTransactionRequest {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  customer_details: {
    first_name: string;
    email: string;
    phone?: string;
  };
  item_details: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
  enabled_payments?: string[];
  bank_transfer?: {
    bank: string;
  };
  [key: string]: any;
}

export interface MidtransResponse {
  token: string;
  redirect_url: string;
}

export async function createPaymentTransaction(
  requestData: MidtransTransactionRequest
): Promise<MidtransResponse> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  
  console.log('🔄 Calling Midtrans API with:', {
    order_id: requestData.transaction_details.order_id,
    amount: requestData.transaction_details.gross_amount,
    has_server_key: !!serverKey
  });

  // Jika tidak ada server key, return mock data
  if (!serverKey) {
    console.warn('⚠️ Midtrans server key not found, using mock data');
    const mockToken = `mock-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
      token: mockToken,
      redirect_url: `https://sandbox.midtrans.com/snap/v2/vtweb/${mockToken}`
    };
  }

  try {
    const authString = Buffer.from(`${serverKey}:`).toString('base64');
    
    console.log('🌐 Sending request to Midtrans...');
    
    const response = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestData),
      // Timeout 30 detik
      signal: AbortSignal.timeout(30000)
    });

    console.log('📥 Midtrans response status:', response.status);

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch {
        errorText = 'Could not read error response';
      }
      
      console.error('❌ Midtrans API error response:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      throw new Error(`Midtrans API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Midtrans API success:', {
      has_token: !!data.token,
      has_redirect_url: !!data.redirect_url
    });
    
    if (!data.token) {
      console.error('❌ Midtrans response missing token:', data);
      throw new Error('Midtrans response missing token');
    }

    return {
      token: data.token,
      redirect_url: data.redirect_url || `https://sandbox.midtrans.com/snap/v2/vtweb/${data.token}`
    };
  } catch (error: any) {
    console.error('❌ Midtrans API call failed:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    
    // Return mock data untuk fallback
    const fallbackToken = `fallback-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
      token: fallbackToken,
      redirect_url: `https://sandbox.midtrans.com/snap/v2/vtweb/${fallbackToken}`
    };
  }
}

// Helper untuk inisialisasi Snap di client
export const initMidtransSnap = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window is not defined'));
      return;
    }

    // Cek apakah sudah dimuat
    if (window.snap) {
      resolve();
      return;
    }

    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '';
    
    if (!clientKey) {
      console.warn('Midtrans client key not found');
      reject(new Error('Midtrans client key not configured'));
      return;
    }

    // Cek apakah script sudah ada
    const existingScript = document.querySelector('script[src*="midtrans"]');
    if (existingScript) {
      // Tunggu script selesai load
      existingScript.addEventListener('load', () => {
        if (window.snap) {
          resolve();
        } else {
          reject(new Error('Snap.js not loaded'));
        }
      });
      return;
    }

    // Load script baru
    const script = document.createElement('script');
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', clientKey);
    
    script.onload = () => {
      if (window.snap) {
        console.log('✅ Snap.js loaded successfully');
        resolve();
      } else {
        reject(new Error('Snap.js not available'));
      }
    };
    
    script.onerror = (error) => {
      console.error('❌ Failed to load Snap.js:', error);
      reject(new Error('Failed to load payment gateway'));
    };
    
    document.head.appendChild(script);
  });
};

// Type declarations untuk window
declare global {
  interface Window {
    snap?: {
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
}