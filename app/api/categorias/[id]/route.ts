import { NextRequest, NextResponse } from 'next/server'
import { CategoriaService } from '@/lib/services/categoria.service'
import { verificarAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const categoria = await CategoriaService.obtenerCategoriaPorId(id)
    
    if (!categoria) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: categoria })
  } catch (error) {
    console.error('Error en GET /api/categorias/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación y permisos de admin
    const authResult = await verificarAuth(request)
    if (!authResult.success || !authResult.usuario) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (authResult.usuario.rol !== 'admin') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await request.json()
    
    if (!body.nombre || !body.nombre.trim()) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const categoriaData = {
      nombre: body.nombre.trim(),
      descripcion: body.descripcion?.trim() || '',
      imagen: body.imagen?.trim() || null,
      activo: body.activo !== false,
      orden: body.orden || 1
    }

    const actualizado = await CategoriaService.actualizarCategoria(id, categoriaData)
    
    if (!actualizado) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })
    }

    const categoria = await CategoriaService.obtenerCategoriaPorId(id)
    return NextResponse.json({ 
      success: true, 
      data: categoria 
    })
  } catch (error) {
    console.error('Error en PUT /api/categorias/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación y permisos de admin
    const authResult = await verificarAuth(request)
    if (!authResult.success || !authResult.usuario) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (authResult.usuario.rol !== 'admin') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const eliminado = await CategoriaService.eliminarCategoria(id)
    
    if (!eliminado) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Categoría eliminada correctamente' 
    })
  } catch (error) {
    console.error('Error en DELETE /api/categorias/[id]:', error)
    
    // Manejar errores específicos
    if (error instanceof Error && error.message.includes('productos asociados')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
