import { NextRequest, NextResponse } from 'next/server';
import { ConfiguracionService } from '@/lib/services/configuracion.service';
import { requiereAdmin } from '@/lib/middleware/auth';

export async function GET() {
  try {
    const configuracion = await ConfiguracionService.obtenerConfiguracion();
    return NextResponse.json(configuracion);
  } catch (error) {
    console.error('Error en GET /api/configuracion:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export const PUT = requiereAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json();
    
    if (!body.clave || !body.valor) {
      return NextResponse.json(
        { error: 'Clave y valor son requeridos' },
        { status: 400 }
      );
    }
    
    const actualizado = await ConfiguracionService.establecerConfiguracion(
      body.clave,
      body.valor
    );
    
    if (!actualizado) {
      return NextResponse.json(
        { error: 'Error al actualizar configuración' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ mensaje: 'Configuración actualizada correctamente' });
  } catch (error) {
    console.error('Error en PUT /api/configuracion:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
});
