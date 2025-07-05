import { NextRequest, NextResponse } from 'next/server';
import { DashboardService } from '@/lib/services/dashboard.service';
import { requiereAdmin } from '@/lib/middleware/auth';

export const GET = requiereAdmin(async () => {
  try {
    const estadisticas = await DashboardService.obtenerEstadisticas();
    return NextResponse.json({
      success: true,
      data: estadisticas
    });
  } catch (error) {
    console.error('Error en GET /api/dashboard/estadisticas:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
});
