import { NextRequest, NextResponse } from 'next/server';
import { DashboardService } from '@/lib/services/dashboard.service';
import { requiereAdmin } from '@/lib/middleware/auth';

export const GET = requiereAdmin(async (request: NextRequest) => {
  try {
    const url = new URL(request.url);
    const limite = parseInt(url.searchParams.get('limite') || '10');
    
    const productos = await DashboardService.obtenerProductosMasVendidos(limite);
    return NextResponse.json(productos);
  } catch (error) {
    console.error('Error en GET /api/dashboard/productos-mas-vendidos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
});
