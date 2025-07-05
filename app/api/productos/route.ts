import { NextRequest, NextResponse } from 'next/server'
import { ProductoService } from '@/lib/services/producto.service'
import { FiltroProductos } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Verificar si es una petición de admin
    const incluirTodos = searchParams.get('admin') === 'true'
    const incluirCategoria = searchParams.get('incluir_categoria') === 'true'
    
    if (incluirTodos) {
      // Usar el método de admin que incluye todos los estados
      const filtros = {
        categoria_id: searchParams.get('categoria_id') ? parseInt(searchParams.get('categoria_id')!) : undefined,
        busqueda: searchParams.get('busqueda') || undefined,
        estado: searchParams.get('estado') || 'todos',
        orden: searchParams.get('orden') || 'fecha',
        pagina: searchParams.get('pagina') ? parseInt(searchParams.get('pagina')!) : 1,
        limite: searchParams.get('limite') ? parseInt(searchParams.get('limite')!) : 20
      }

      const resultado = await ProductoService.obtenerProductosAdmin(filtros)
      
      return NextResponse.json({
        success: true,
        data: resultado.productos,
        total: resultado.total
      })
    }
    
    // Extraer parámetros de consulta para usuarios normales
    const filtros: FiltroProductos = {
      categoria_id: searchParams.get('categoria_id') ? parseInt(searchParams.get('categoria_id')!) : undefined,
      genero: searchParams.get('genero') as 'masculino' | 'femenino' | 'unisex' | undefined,
      precio_min: searchParams.get('precio_min') ? parseFloat(searchParams.get('precio_min')!) : undefined,
      precio_max: searchParams.get('precio_max') ? parseFloat(searchParams.get('precio_max')!) : undefined,
      moneda: (searchParams.get('moneda') as 'PEN' | 'USD' | 'EUR') || 'PEN',
      destacado: searchParams.get('destacado') ? searchParams.get('destacado') === 'true' : undefined,
      en_oferta: searchParams.get('en_oferta') ? searchParams.get('en_oferta') === 'true' : undefined,
      busqueda: searchParams.get('busqueda') || undefined,
      orden: (searchParams.get('orden') as 'precio_asc' | 'precio_desc' | 'nombre' | 'fecha') || 'fecha',
      pagina: searchParams.get('pagina') ? parseInt(searchParams.get('pagina')!) : 1,
      limite: searchParams.get('limite') ? parseInt(searchParams.get('limite')!) : 20
    }

    const productos = await ProductoService.obtenerProductos(filtros)

    return NextResponse.json({
      success: true,
      data: productos.datos,
      pagination: {
        total: productos.total,
        pagina: productos.pagina,
        limite: productos.limite,
        total_paginas: productos.total_paginas
      }
    })
  } catch (error) {
    console.error('Error en API productos:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener productos' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validaciones básicas
    if (!body.nombre || !body.categoria_id || !body.precio_pen) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Faltan campos requeridos: nombre, categoria_id, precio_pen' 
        },
        { status: 400 }
      )
    }

    const productoId = await ProductoService.crearProducto(body)

    return NextResponse.json({
      success: true,
      data: { id: productoId },
      message: 'Producto creado exitosamente'
    })
  } catch (error) {
    console.error('Error creando producto:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al crear producto' 
      },
      { status: 500 }
    )
  }
}
