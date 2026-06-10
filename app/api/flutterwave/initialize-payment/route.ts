import { NextResponse } from 'next/server';

/**
 * PRODUCTION-READY NEXT.JS API ROUTE (App Router)
 * POST /api/flutterwave/initialize-payment
 * 
 * Safely creates a Flutterwave payment link without exposing secret keys to the client.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, email, tx_ref } = body;

    // Validate request input
    if (!amount || !email || !tx_ref) {
      return NextResponse.json(
        { status: 'error', message: 'Missing required fields: amount, email, or tx_ref' },
        { status: 400 }
      );
    }

    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    const publicKey = process.env.FLUTTERWAVE_PUBLIC_KEY;
    const subaccountId = process.env.FLUTTERWAVE_SUBACCOUNT_ID;
    
    // Fallback: use NEXT_PUBLIC_BASE_URL or dynamically fallback to standard headers
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const redirectUrl = `${baseUrl}/payment/callback`;

    // Ensure API keys are present
    if (!secretKey) {
      console.error('[Flutterwave] Initialisation Error: FLUTTERWAVE_SECRET_KEY is not defined in environment variables.');
      return NextResponse.json(
        { status: 'error', message: 'Payment gateway configuration missing. Please review your server environment.' },
        { status: 500 }
      );
    }

    // Build checkout transaction payload
    const payload: any = {
      tx_ref: tx_ref,
      amount: Number(amount),
      currency: 'NGN',
      redirect_url: redirectUrl,
      customer: {
        email: email,
        name: 'Marketplace Customer'
      },
      customizations: {
        title: 'Escrow Digital Asset Checkout',
        description: `Release order code: ${tx_ref}`,
        logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80'
      }
    };

    // Integrate Split Payout subaccount if provided
    if (subaccountId && subaccountId.trim() !== '') {
      console.log(`[Flutterwave] Directing split payment to designated subaccount: ${subaccountId}`);
      payload.subaccounts = [
        {
          id: subaccountId.trim()
        }
      ];
    }

    console.log('[Flutterwave] Contacting Flutterwave checkout API endpoints...', payload);

    // Call official Flutterwave API v3 payments endpoint
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || data.status !== 'success') {
      console.error('[Flutterwave] Flutterwave API Error:', data);
      return NextResponse.json(
        { status: 'error', message: data.message || 'Failed to initialize payment from Flutterwave API' },
        { status: 502 }
      );
    }

    // Return generated secure checkout link and keys
    return NextResponse.json({
      status: 'success',
      link: data.data.link,
      publicKey: publicKey || null,
      tx_ref
    });

  } catch (error: any) {
    console.error('[Flutterwave] Initialize error handler caught exception:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Internal server error during payment initialization' },
      { status: 500 }
    );
  }
}
