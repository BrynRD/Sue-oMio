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

// DELETE - Eliminar imágenes de un color específico
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; color: string }> }
) {
  try {
    const { id, color } = await params
    const connection = await mysql.createConnection(DB_CONFIG)
    
    // Eliminar imágenes del color específico
    const [result] = await connection.execute(`
      DELETE FROM imagenes_por_color 
      WHERE producto_id = ? AND color = ?
    `, [id, decodeURIComponent(color)])

    await connection.end()

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: 'No se encontraron imágenes para este color' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Imágenes del color ${color} eliminadas correctamente`
    })
  } catch (error) {
    console.error('Error al eliminar imágenes por color:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
