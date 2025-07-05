import { NextRequest, NextResponse } from 'next/server';
import { DashboardService } from '@/lib/services/dashboard.service';
import { requiereAdmin } from '@/lib/middleware/auth';

export const GET = requiereAdmin(async () => {
  try {
    const pedidos = await DashboardService.obtenerPedidosRecientes();
    return NextResponse.json({
      success: true,
      data: pedidos
    });
  } catch (error) {
    console.error('Error en GET /api/dashboard/pedidos-recientes:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
});
