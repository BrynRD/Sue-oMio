import { NextRequest, NextResponse } from 'next/server'
import { ProductoService } from '@/lib/services/producto.service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const producto = await ProductoService.obtenerProductoPorId(id)

    if (!producto) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Producto no encontrado' 
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: producto
    })
  } catch (error) {
    console.error('Error obteniendo producto:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener producto' 
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)
    const body = await request.json()
    
    if (isNaN(id)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID de producto inválido' 
        },
        { status: 400 }
      )
    }

    // Extraer imágenes y variantes del body
    const { imagenes, variantes, ...productoData } = body

    // Actualizar producto principal
    const actualizado = await ProductoService.actualizarProducto(id, productoData)

    // Guardar imágenes si vienen
    if (Array.isArray(imagenes)) {
      await ProductoService.guardarImagenesProducto(id, imagenes)
    }
    // Guardar variantes si vienen
    if (Array.isArray(variantes)) {
      await ProductoService.guardarVariantesProducto(id, variantes)
    }

    if (!actualizado) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Producto no encontrado o no se pudo actualizar' 
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Producto actualizado exitosamente'
    })
  } catch (error) {
    console.error('Error actualizando producto:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al actualizar producto' 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const eliminado = await ProductoService.eliminarProducto(id)

    if (!eliminado) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Producto no encontrado o no se pudo eliminar' 
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    })
  } catch (error) {
    console.error('Error eliminando producto:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al eliminar producto' 
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'ID de producto inválido' },
        { status: 400 }
      )
    }
    const body = await request.json()
    const url = body.url
    if (!url) {
      return NextResponse.json(
        { success: false, error: 'Falta la URL de la imagen' },
        { status: 400 }
      )
    }
    await ProductoService.asociarImagenPrincipal(id, url)
    return NextResponse.json({ success: true, message: 'Imagen asociada correctamente' })
  } catch (error) {
    console.error('Error asociando imagen principal:', error)
    return NextResponse.json(
      { success: false, error: 'Error al asociar imagen principal' },
      { status: 500 }
    )
  }
}
