import { NextRequest, NextResponse } from 'next/server';
import { ConfiguracionService } from '@/lib/services/configuracion.service';

export async function POST(request: NextRequest) {
  try {
    const { precio, moneda_origen, moneda_destino } = await request.json();
    
    if (typeof precio !== 'number' || !moneda_origen || !moneda_destino) {
      return NextResponse.json(
        { error: 'Precio, moneda origen y moneda destino son requeridos' },
        { status: 400 }
      );
    }
    
    if (precio < 0) {
      return NextResponse.json(
        { error: 'El precio no puede ser negativo' },
        { status: 400 }
      );
    }
    
    const precioConvertido = await ConfiguracionService.convertirPrecio(
      precio,
      moneda_origen,
      moneda_destino
    );
    
    return NextResponse.json({
      precio_original: precio,
      moneda_origen,
      precio_convertido: precioConvertido,
      moneda_destino
    });
  } catch (error) {
    console.error('Error en POST /api/configuracion/convertir-precio:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
