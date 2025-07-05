import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sueno_mio_store',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}

// GET - Obtener imágenes por color de un producto
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const connection = await mysql.createConnection(DB_CONFIG)
    
    const [rows] = await connection.execute(`
      SELECT 
        id,
        producto_id,
        color,
        imagen_principal,
        imagenes,
        activo
      FROM imagenes_por_color 
      WHERE producto_id = ? AND activo = 1
      ORDER BY color
    `, [id])

    await connection.end()

    // Parsear JSON de imágenes
    const resultado = (rows as any[]).map(row => ({
      ...row,
      imagenes: row.imagenes ? JSON.parse(row.imagenes) : []
    }))

    return NextResponse.json(resultado)
  } catch (error) {
    console.error('Error al obtener imágenes por color:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear o actualizar imágenes para un color específico
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { color, imagen_principal, imagenes } = await request.json()

    if (!color) {
      return NextResponse.json(
        { error: 'El color es requerido' },
        { status: 400 }
      )
    }

    const connection = await mysql.createConnection(DB_CONFIG)

    // Verificar que el producto existe
    const [productExists] = await connection.execute(
      'SELECT id FROM productos WHERE id = ?',
      [id]
    )

    if ((productExists as any[]).length === 0) {
      await connection.end()
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el color existe en las variantes del producto
    const [colorExists] = await connection.execute(
      'SELECT id FROM variantes_productos WHERE producto_id = ? AND color = ? LIMIT 1',
      [id, color]
    )

    if ((colorExists as any[]).length === 0) {
      await connection.end()
      return NextResponse.json(
        { error: `No existe el color "${color}" para este producto` },
        { status: 400 }
      )
    }

    // Insertar o actualizar imágenes por color
    await connection.execute(`
      INSERT INTO imagenes_por_color (producto_id, color, imagen_principal, imagenes, activo)
      VALUES (?, ?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE
        imagen_principal = VALUES(imagen_principal),
        imagenes = VALUES(imagenes),
        updated_at = CURRENT_TIMESTAMP
    `, [
      id,
      color,
      imagen_principal,
      JSON.stringify(imagenes || [])
    ])

    await connection.end()

    return NextResponse.json({
      success: true,
      message: `Imágenes del color ${color} actualizadas correctamente`
    })
  } catch (error) {
    console.error('Error al guardar imágenes por color:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
