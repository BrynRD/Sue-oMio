import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { verificarAuth } from '@/lib/auth'

// PUT - Sincronizar stock del producto con la suma de sus variantes
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const authResult = await verificarAuth(request)
    if (!authResult.success || authResult.usuario?.rol !== 'admin') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No autorizado' 
        },
        { status: 401 }
      )
    }

    const { id } = await params
    const productId = parseInt(id)
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID de producto inválido' 
        },
        { status: 400 }
      )
    }

    // Calcular el stock total de todas las variantes activas
    const stockQuery = `
      SELECT COALESCE(SUM(stock), 0) as stock_total 
      FROM variantes_productos 
      WHERE producto_id = ? AND activo = 1
    `
    
    const resultado = await executeQuery(stockQuery, [productId]) as any[]
    const stockTotal = resultado[0]?.stock_total || 0

    // Actualizar el stock del producto base
    const updateQuery = `
      UPDATE productos 
      SET stock = ? 
      WHERE id = ?
    `
    
    await executeQuery(updateQuery, [stockTotal, productId])

    return NextResponse.json({
      success: true,
      data: {
        producto_id: productId,
        stock_anterior: 0, // Podríamos obtener esto si es necesario
        stock_nuevo: stockTotal,
        mensaje: `Stock sincronizado: ${stockTotal} unidades`
      }
    })

  } catch (error) {
    console.error('Error sincronizando stock:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al sincronizar stock' 
      },
      { status: 500 }
    )
  }
}
