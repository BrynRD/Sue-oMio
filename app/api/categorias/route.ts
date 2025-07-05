import { NextRequest, NextResponse } from 'next/server'
import { CategoriaService } from '@/lib/services/categoria.service'
import { verificarAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const incluirProductos = searchParams.get('incluir_productos') === 'true'
    
    const categorias = await CategoriaService.obtenerCategorias(incluirProductos)
    return NextResponse.json(categorias)
  } catch (error) {
    console.error('Error en GET /api/categorias:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación y permisos de admin
    const authResult = await verificarAuth(request)
    if (!authResult.success || !authResult.usuario) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (authResult.usuario.rol !== 'admin') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
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
      activo: body.activo !== false, // Por defecto true
      orden: body.orden || 1
    }
    
    const categoriaId = await CategoriaService.crearCategoria(categoriaData)
    const categoria = await CategoriaService.obtenerCategoriaPorId(categoriaId)
    
    return NextResponse.json({ 
      success: true, 
      data: categoria 
    }, { status: 201 })
  } catch (error) {
    console.error('Error en POST /api/categorias:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
