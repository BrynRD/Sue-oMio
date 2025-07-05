import { NextRequest, NextResponse } from 'next/server'

// Simulación de la API de Culqi para desarrollo
// En producción, usarías la librería oficial de Culqi

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      amount, // Monto en centavos
      currency_code, // PEN, USD, etc.
      email,
      source_id, // Token de la tarjeta
      description,
      metadata 
    } = body

    // Validaciones básicas
    if (!amount || amount <= 0) {
      return NextResponse.json({ 
        error: 'Monto inválido' 
      }, { status: 400 })
    }

    if (!source_id) {
      return NextResponse.json({ 
        error: 'Token de tarjeta requerido' 
      }, { status: 400 })
    }

    if (!email) {
      return NextResponse.json({ 
        error: 'Email requerido' 
      }, { status: 400 })
    }

    // Simulación de procesamiento con Culqi
    // En producción, usarías algo como:
    /*
    const Culqi = require('culqi-node');
    const culqi = new Culqi(process.env.CULQI_SECRET_KEY);
    
    const charge = await culqi.charges.create({
      amount: amount,
      currency_code: currency_code,
      email: email,
      source_id: source_id,
      description: description,
      metadata: metadata
    });
    */

    // Simular diferentes escenarios de respuesta
    const shouldSucceed = Math.random() > 0.1 // 90% de éxito

    if (!shouldSucceed) {
      return NextResponse.json({
        error: 'Tarjeta declinada. Intenta con otra tarjeta.',
        error_code: 'card_declined'
      }, { status: 400 })
    }

    // Respuesta exitosa simulada
    const mockResponse = {
      id: `chr_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      object: 'charge',
      amount: amount,
      amount_refunded: 0,
      currency_code: currency_code || 'PEN',
      email: email,
      description: description || 'Compra en Sueño Mío',
      source: {
        id: source_id,
        type: 'card',
        brand: 'visa', // Simulado
        last_four: '4242' // Simulado
      },
      outcome: {
        type: 'sale',
        code: 'AUT0000',
        merchant_message: 'Transacción aprobada',
        user_message: 'Su transacción ha sido aprobada.'
      },
      reference_code: `REF${Date.now()}`,
      authorization_code: `AUT${Math.floor(Math.random() * 1000000)}`,
      paid: true,
      captured: true,
      creation_date: new Date().toISOString(),
      metadata: metadata || {}
    }

    // Log para debugging (en producción usar un logger apropiado)
    console.log('Pago procesado exitosamente:', {
      id: mockResponse.id,
      amount: amount,
      email: email,
      currency: currency_code
    })

    return NextResponse.json({
      success: true,
      data: mockResponse
    })

  } catch (error) {
    console.error('Error procesando pago con Culqi:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        error_code: 'internal_error'
      },
      { status: 500 }
    )
  }
}

// Configuración para el endpoint
export const runtime = 'nodejs'
