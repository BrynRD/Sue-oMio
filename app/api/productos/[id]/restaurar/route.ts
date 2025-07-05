import { NextRequest, NextResponse } from 'next/server'
import { ProductoService } from '@/lib/services/producto.service'
import jwt from 'jsonwebtoken'
import db from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación de admin
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    let decoded: any

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!)
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Verificar que el usuario sea admin
    const [userRows] = await db.execute(
      'SELECT rol FROM usuarios WHERE id = ?',
      [decoded.id]
    )
    
    const user = (userRows as any[])[0]
    if (!user || user.rol !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { id: idParam } = await params
    const id = parseInt(idParam)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID de producto inválido' 
        },
        { status: 400 }
      )
    }

    const restaurado = await ProductoService.restaurarProducto(id)

    if (!restaurado) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Producto no encontrado o no se pudo restaurar' 
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Producto restaurado exitosamente'
    })
  } catch (error) {
    console.error('Error restaurando producto:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al restaurar producto' 
      },
      { status: 500 }
    )
  }
}
