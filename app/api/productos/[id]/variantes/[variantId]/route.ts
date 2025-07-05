import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { verificarAuth } from '@/lib/auth'

// PUT - Actualizar variante
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; variantId: string } }
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

    const productId = parseInt(params.id)
    const variantId = parseInt(params.variantId)
    
    if (isNaN(productId) || isNaN(variantId)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'IDs inválidos' 
        },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { color, talla, stock, sku, imagen_url, activo } = body

    // Si se está actualizando color/talla, verificar que no exista ya esa combinación
    if (color && talla) {
      const existeQuery = `
        SELECT id FROM variantes_productos 
        WHERE producto_id = ? AND color = ? AND talla = ? AND id != ?
      `
      const existe = await executeQuery(existeQuery, [productId, color, talla, variantId]) as any[]
      
      if (existe && existe.length > 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Ya existe otra variante con este color y talla' 
          },
          { status: 400 }
        )
      }
    }

    // Construir query de actualización dinámicamente
    const updates: string[] = []
    const values: any[] = []

    if (color !== undefined) {
      updates.push('color = ?')
      values.push(color)
    }
    if (talla !== undefined) {
      updates.push('talla = ?')
      values.push(talla)
    }
    if (stock !== undefined) {
      updates.push('stock = ?')
      values.push(stock)
    }
    if (sku !== undefined) {
      updates.push('sku = ?')
      values.push(sku || null)
    }
    if (imagen_url !== undefined) {
      updates.push('imagen_url = ?')
      values.push(imagen_url || null)
    }
    if (activo !== undefined) {
      updates.push('activo = ?')
      values.push(activo)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No hay campos para actualizar' 
        },
        { status: 400 }
      )
    }

    const updateQuery = `
      UPDATE variantes_productos 
      SET ${updates.join(', ')}
      WHERE id = ? AND producto_id = ?
    `
    
    values.push(variantId, productId)

    await executeQuery(updateQuery, values)

    return NextResponse.json({
      success: true,
      data: { mensaje: 'Variante actualizada exitosamente' }
    })
  } catch (error) {
    console.error('Error actualizando variante:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al actualizar variante' 
      },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar variante
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; variantId: string } }
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

    const productId = parseInt(params.id)
    const variantId = parseInt(params.variantId)
    
    if (isNaN(productId) || isNaN(variantId)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'IDs inválidos' 
        },
        { status: 400 }
      )
    }

    // Verificar que la variante existe y pertenece al producto
    const existeQuery = `
      SELECT id FROM variantes_productos 
      WHERE id = ? AND producto_id = ?
    `
    const existe = await executeQuery(existeQuery, [variantId, productId]) as any[]
    
    if (!existe || existe.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Variante no encontrada' 
        },
        { status: 404 }
      )
    }

    // Eliminar variante
    const deleteQuery = `
      DELETE FROM variantes_productos 
      WHERE id = ? AND producto_id = ?
    `

    await executeQuery(deleteQuery, [variantId, productId])

    return NextResponse.json({
      success: true,
      data: { mensaje: 'Variante eliminada exitosamente' }
    })
  } catch (error) {
    console.error('Error eliminando variante:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al eliminar variante' 
      },
      { status: 500 }
    )
  }
}
