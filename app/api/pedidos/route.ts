import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { ResultSetHeader, RowDataPacket } from 'mysql2'
import jwt from 'jsonwebtoken'

// GET - Obtener pedidos del usuario autenticado
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    let userId: number

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
      userId = decoded.userId
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Obtener pedidos del usuario
    const [rows] = await db.execute(`
      SELECT 
        p.id,
        p.total,
        p.estado,
        p.fecha_pedido,
        p.direccion_envio,
        p.metodo_pago,
        COUNT(dp.id) as cantidad_productos
      FROM pedidos p
      LEFT JOIN detalle_pedidos dp ON p.id = dp.pedido_id
      WHERE p.usuario_id = ?
      GROUP BY p.id
      ORDER BY p.fecha_pedido DESC
    `, [userId])

    return NextResponse.json({
      success: true,
      data: rows
    })

  } catch (error) {
    console.error('Error al obtener pedidos:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo pedido
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    let userId: number

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
      userId = decoded.userId
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      items, 
      total, 
      direccion_envio, 
      metodo_pago, 
      notas 
    } = body

    // Validaciones
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items requeridos' }, { status: 400 })
    }

    if (!total || total <= 0) {
      return NextResponse.json({ error: 'Total inválido' }, { status: 400 })
    }

    if (!direccion_envio) {
      return NextResponse.json({ error: 'Dirección de envío requerida' }, { status: 400 })
    }

    // Crear el pedido
    const [result] = await db.execute(`
      INSERT INTO pedidos (
        usuario_id, 
        total, 
        estado, 
        direccion_envio, 
        metodo_pago, 
        notas,
        fecha_pedido
      ) VALUES (?, ?, 'pendiente', ?, ?, ?, NOW())
    `, [userId, total, direccion_envio, metodo_pago || 'efectivo', notas || ''])

    const pedidoId = (result as ResultSetHeader).insertId

    // Insertar detalles del pedido
    for (const item of items) {
      await db.execute(`
        INSERT INTO detalle_pedidos (
          pedido_id, 
          producto_id, 
          cantidad, 
          precio_unitario, 
          talla, 
          color
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        pedidoId, 
        item.id, 
        item.cantidad, 
        item.precio, 
        item.talla || '', 
        item.color || ''
      ])

      // Actualizar stock del producto
      await db.execute(`
        UPDATE productos 
        SET stock = stock - ? 
        WHERE id = ? AND stock >= ?
      `, [item.cantidad, item.id, item.cantidad])
    }

    return NextResponse.json({
      success: true,
      data: {
        id: pedidoId,
        mensaje: 'Pedido creado exitosamente'
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error al crear pedido:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
