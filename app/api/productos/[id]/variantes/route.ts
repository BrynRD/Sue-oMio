import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { verificarAuth } from '@/lib/auth'

// GET - Obtener todas las variantes de un producto
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const query = `
      SELECT 
        id,
        producto_id,
        color,
        talla,
        stock,
        sku,
        imagen_url,
        activo,
        fecha_creacion
      FROM variantes_productos 
      WHERE producto_id = ?
      ORDER BY color, talla
    `

    const variantes = await executeQuery(query, [productId]) as any[]

    return NextResponse.json({
      success: true,
      data: variantes || []
    })
  } catch (error) {
    console.error('Error obteniendo variantes:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: `Error al obtener variantes: ${(error as Error).message || 'Error desconocido'}` 
      },
      { status: 500 }
    )
  }
}

// POST - Crear nueva variante
export async function POST(
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

    const body = await request.json()
    const { color, talla, stock, sku, imagen_url } = body

    // Validaciones
    if (!color || !talla) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Color y talla son requeridos' 
        },
        { status: 400 }
      )
    }

    // Verificar que no exista ya esta combinación
    const existeQuery = `
      SELECT id FROM variantes_productos 
      WHERE producto_id = ? AND color = ? AND talla = ?
    `
    const existe = await executeQuery(existeQuery, [productId, color, talla]) as any[]
    
    if (existe && existe.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ya existe una variante con este color y talla' 
        },
        { status: 400 }
      )
    }

    // Crear variante
    const insertQuery = `
      INSERT INTO variantes_productos (
        producto_id, color, talla, stock, sku, imagen_url, activo
      ) VALUES (?, ?, ?, ?, ?, ?, 1)
    `

    const result = await executeQuery(insertQuery, [
      productId,
      color,
      talla,
      stock || 0,
      sku || null,
      imagen_url || null
    ]) as any

    return NextResponse.json({
      success: true,
      data: { 
        id: result.insertId,
        mensaje: 'Variante creada exitosamente' 
      }
    })
  } catch (error) {
    console.error('Error creando variante:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al crear variante' 
      },
      { status: 500 }
    )
  }
}
