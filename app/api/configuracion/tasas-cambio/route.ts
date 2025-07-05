import { NextRequest, NextResponse } from 'next/server';
import { ConfiguracionService } from '@/lib/services/configuracion.service';
import { requiereAdmin } from '@/lib/middleware/auth';

export async function GET() {
  try {
    const tasas = await ConfiguracionService.obtenerTasasCambio();
    return NextResponse.json(tasas);
  } catch (error) {
    console.error('Error en GET /api/configuracion/tasas-cambio:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export const PUT = requiereAdmin(async (request: NextRequest) => {
  try {
    const { moneda_base, moneda_destino, tasa } = await request.json();
    
    if (!moneda_base || !moneda_destino || typeof tasa !== 'number') {
      return NextResponse.json(
        { error: 'Moneda base, moneda destino y tasa son requeridos' },
        { status: 400 }
      );
    }
    
    if (tasa <= 0) {
      return NextResponse.json(
        { error: 'La tasa debe ser mayor a 0' },
        { status: 400 }
      );
    }
    
    const actualizado = await ConfiguracionService.actualizarTasaCambio(
      moneda_base,
      moneda_destino,
      tasa
    );
    
    if (!actualizado) {
      return NextResponse.json(
        { error: 'Error al actualizar tasa de cambio' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ mensaje: 'Tasa de cambio actualizada correctamente' });
  } catch (error) {
    console.error('Error en PUT /api/configuracion/tasas-cambio:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
});
