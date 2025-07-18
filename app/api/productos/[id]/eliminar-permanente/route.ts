import { NextRequest, NextResponse } from 'next/server'
import { ProductoService } from '@/lib/services/producto.service'
import jwt from 'jsonwebtoken'
import db from '@/lib/db'

export async function DELETE(
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

    try {
      const eliminado = await ProductoService.eliminarProductoPermanentemente(id)

      if (!eliminado) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Producto no encontrado o no se pudo eliminar permanentemente' 
          },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Producto eliminado permanentemente'
      })
    } catch (error: any) {
      if (error.message.includes('pedidos asociados')) {
        return NextResponse.json(
          { 
            success: false, 
            error: error.message 
          },
          { status: 400 }
        )
      }
      throw error
    }
  } catch (error) {
    console.error('Error eliminando producto permanentemente:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al eliminar producto permanentemente' 
      },
      { status: 500 }
    )
  }
}
