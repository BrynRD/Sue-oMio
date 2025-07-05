import { executeQuery } from '@/lib/db'
import { Producto, FiltroProductos, RespuestaPaginada } from '@/types'

export class ProductoService {
  // Obtener todos los productos con filtros
  static async obtenerProductos(filtros: FiltroProductos = {}): Promise<RespuestaPaginada<Producto>> {
    const {
      categoria_id,
      genero,
      precio_min,
      precio_max,
      moneda = 'PEN',
      destacado,
      en_oferta,
      busqueda,
      orden = 'fecha',
      pagina = 1,
      limite = 20
    } = filtros

    let whereConditions: string[] = ['p.activo = 1', 'p.eliminado = 0']
    let queryParams: any[] = []

    // Aplicar filtros
    if (categoria_id) {
      whereConditions.push('p.categoria_id = ?')
      queryParams.push(categoria_id)
    }

    if (genero) {
      whereConditions.push('p.genero = ?')
      queryParams.push(genero)
    }

    if (destacado !== undefined) {
      whereConditions.push('p.destacado = ?')
      queryParams.push(destacado)
    }

    if (en_oferta !== undefined) {
      whereConditions.push('p.en_oferta = ?')
      queryParams.push(en_oferta)
    }

    // Filtro de precio según moneda
    if (precio_min !== undefined) {
      const campoPrecio = `p.precio_${moneda.toLowerCase()}`
      whereConditions.push(`${campoPrecio} >= ?`)
      queryParams.push(precio_min)
    }

    if (precio_max !== undefined) {
      const campoPrecio = `p.precio_${moneda.toLowerCase()}`
      whereConditions.push(`${campoPrecio} <= ?`)
      queryParams.push(precio_max)
    }

    // Búsqueda por texto
    if (busqueda) {
      whereConditions.push('(p.nombre LIKE ? OR p.descripcion LIKE ?)')
      queryParams.push(`%${busqueda}%`, `%${busqueda}%`)
    }

    // Construir ORDER BY
    let orderBy = 'p.fecha_creacion DESC'
    switch (orden) {
      case 'precio_asc':
        orderBy = `p.precio_${moneda.toLowerCase()} ASC`
        break
      case 'precio_desc':
        orderBy = `p.precio_${moneda.toLowerCase()} DESC`
        break
      case 'nombre':
        orderBy = 'p.nombre ASC'
        break
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''
    
    // Query principal
    const offset = (pagina - 1) * limite
    const query = `
      SELECT 
        p.*,
        p.precio_pen as precio,
        c.nombre as categoria_nombre,
        (SELECT url FROM imagenes_productos ip WHERE ip.producto_id = p.id AND ip.es_principal = 1 LIMIT 1) as imagen_principal,
        (SELECT GROUP_CONCAT(DISTINCT v.color) FROM variantes_productos v WHERE v.producto_id = p.id AND v.activo = 1) as colores_disponibles,
        (SELECT GROUP_CONCAT(DISTINCT v.talla) FROM variantes_productos v WHERE v.producto_id = p.id AND v.activo = 1) as tallas_disponibles
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `

    queryParams.push(limite, offset)

    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM productos p
      ${whereClause}
    `

    const countParams = queryParams.slice(0, -2) // Remover LIMIT y OFFSET

    try {
      const [productos, countResult] = await Promise.all([
        executeQuery(query, queryParams) as Promise<Producto[]>,
        executeQuery(countQuery, countParams) as Promise<{total: number}[]>
      ])

      // Enriquecer productos con imágenes por color
      const productosEnriquecidos = await Promise.all(productos.map(async (producto) => {
        // Obtener imágenes por color para cada producto
        const imagenesQuery = `
          SELECT color, url 
          FROM imagenes_productos 
          WHERE producto_id = ? AND color IS NOT NULL
        `
        const imagenes = await executeQuery(imagenesQuery, [producto.id]) as any[]
        
        // Crear objeto de imágenes por color
        const imagenes_por_color: Record<string, string> = {}
        imagenes.forEach(img => {
          if (img.color && !imagenes_por_color[img.color]) {
            imagenes_por_color[img.color] = img.url
          }
        })

        return {
          ...producto,
          imagenes_por_color
        }
      }))

      const total = countResult[0]?.total || 0
      const total_paginas = Math.ceil(total / limite)

      return {
        datos: productosEnriquecidos,
        total,
        pagina,
        limite,
        total_paginas
      }
    } catch (error) {
      console.error('Error obteniendo productos:', error)
      throw new Error('Error al obtener productos')
    }
  }

  // Obtener producto por ID
  static async obtenerProductoPorId(id: number): Promise<any | null> {
    const query = `
      SELECT 
        p.*,
        p.precio_pen as precio,
        c.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.id = ? AND p.activo = 1
    `

    try {
      const result = await executeQuery(query, [id]) as any[]
      const producto = result[0]
      
      if (!producto) return null

      // Obtener variantes del producto
      const variantesQuery = `
        SELECT DISTINCT color, talla, stock, activo
        FROM variantes_productos 
        WHERE producto_id = ? AND activo = 1
        ORDER BY color, talla
      `
      const variantes = await executeQuery(variantesQuery, [id]) as any[]

      // Obtener todas las imágenes del producto
      const imagenesQuery = `
        SELECT url, color, es_principal 
        FROM imagenes_productos 
        WHERE producto_id = ?
        ORDER BY es_principal DESC, orden ASC, id ASC
      `
      const imagenes = await executeQuery(imagenesQuery, [id]) as any[]

      // Imagen principal (sin color)
      const imagen_principal = imagenes.find(img => img.es_principal && !img.color)?.url || ''
      // Imágenes por color
      const imagenes_por_color: Record<string, string> = {}
      imagenes.forEach(img => {
        if (img.color && !imagenes_por_color[img.color]) {
          imagenes_por_color[img.color] = img.url
        }
      })

      // Procesar tallas y colores únicos
      const tallasUnicas = [...new Set(variantes.map(v => v.talla).filter(Boolean))]
      const coloresUnicos = [...new Set(variantes.map(v => v.color).filter(Boolean))]

      return {
        ...producto,
        variantes,
        tallas: tallasUnicas,
        colores: coloresUnicos,
        imagen_principal,
        imagenes_por_color,
        imagenes: imagenes.map(img => img.url)
      }
    } catch (error) {
      console.error('Error obteniendo producto:', error)
      throw new Error('Error al obtener producto')
    }
  }

  // Obtener productos destacados
  static async obtenerProductosDestacados(limite: number = 8): Promise<Producto[]> {
    const query = `
      SELECT 
        p.*,
        c.nombre as categoria,
        (SELECT url FROM imagenes_productos ip WHERE ip.producto_id = p.id AND ip.es_principal = 1 LIMIT 1) as imagen_principal
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.activo = 1 AND p.destacado = 1
      ORDER BY p.fecha_creacion DESC
      LIMIT ?
    `

    try {
      const result = await executeQuery(query, [limite]) as Producto[]
      return result
    } catch (error) {
      console.error('Error obteniendo productos destacados:', error)
      throw new Error('Error al obtener productos destacados')
    }
  }

  // Crear nuevo producto (para dashboard admin)
  static async crearProducto(producto: Omit<Producto, 'id' | 'fecha_creacion' | 'fecha_actualizacion'>): Promise<number> {
    const query = `
      INSERT INTO productos (
        nombre, descripcion, categoria_id, precio_pen, precio_usd, precio_eur,
        precio_oferta_pen, precio_oferta_usd, precio_oferta_eur,
        stock, stock_minimo, peso, genero, activo, destacado, en_oferta
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    try {
      const result = await executeQuery(query, [
        producto.nombre,
        producto.descripcion,
        producto.categoria_id,
        producto.precio_pen,
        producto.precio_usd,
        producto.precio_eur,
        producto.precio_oferta_pen,
        producto.precio_oferta_usd,
        producto.precio_oferta_eur,
        producto.stock,
        producto.stock_minimo,
        producto.peso,
        producto.genero,
        producto.activo,
        producto.destacado,
        producto.en_oferta
      ]) as any

      return result.insertId
    } catch (error) {
      console.error('Error creando producto:', error)
      throw new Error('Error al crear producto')
    }
  }

  // Actualizar producto
  static async actualizarProducto(id: number, producto: Partial<Producto>): Promise<boolean> {
    const campos: string[] = []
    const valores: any[] = []

    // Construir dinámicamente la query UPDATE
    Object.entries(producto).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'fecha_creacion' && value !== undefined) {
        campos.push(`${key} = ?`)
        valores.push(value)
      }
    })

    if (campos.length === 0) {
      throw new Error('No hay campos para actualizar')
    }

    valores.push(id)

    const query = `UPDATE productos SET ${campos.join(', ')} WHERE id = ?`

    try {
      const result = await executeQuery(query, valores) as any
      return result.affectedRows > 0
    } catch (error) {
      console.error('Error actualizando producto:', error)
      throw new Error('Error al actualizar producto')
    }
  }

  // Desactivar producto (ocultar del catálogo)
  static async desactivarProducto(id: number): Promise<boolean> {
    const query = 'UPDATE productos SET activo = 0 WHERE id = ?'

    try {
      const result = await executeQuery(query, [id]) as any
      return result.affectedRows > 0
    } catch (error) {
      console.error('Error desactivando producto:', error)
      throw new Error('Error al desactivar producto')
    }
  }

  // Activar producto (mostrar en catálogo)
  static async activarProducto(id: number): Promise<boolean> {
    const query = 'UPDATE productos SET activo = 1 WHERE id = ?'

    try {
      const result = await executeQuery(query, [id]) as any
      return result.affectedRows > 0
    } catch (error) {
      console.error('Error activando producto:', error)
      throw new Error('Error al activar producto')
    }
  }

  // Eliminar producto (marcar para eliminación)
  static async eliminarProducto(id: number): Promise<boolean> {
    const query = 'UPDATE productos SET activo = 0, eliminado = 1, fecha_eliminacion = NOW() WHERE id = ?'

    try {
      const result = await executeQuery(query, [id]) as any
      return result.affectedRows > 0
    } catch (error) {
      console.error('Error eliminando producto:', error)
      throw new Error('Error al eliminar producto')
    }
  }

  // Restaurar producto eliminado
  static async restaurarProducto(id: number): Promise<boolean> {
    const query = 'UPDATE productos SET eliminado = 0, fecha_eliminacion = NULL WHERE id = ?'

    try {
      const result = await executeQuery(query, [id]) as any
      return result.affectedRows > 0
    } catch (error) {
      console.error('Error restaurando producto:', error)
      throw new Error('Error al restaurar producto')
    }
  }

  // Eliminar producto permanentemente (marca como eliminado permanentemente)
  // En lugar de eliminar físicamente, lo marcamos como eliminado permanentemente
  // para preservar la integridad referencial con pedidos históricos
  static async eliminarProductoPermanentemente(id: number): Promise<boolean> {
    try {
      // Primero eliminar todas las referencias e imágenes que no afecten la integridad
      await executeQuery('DELETE FROM imagenes_productos WHERE producto_id = ?', [id])
      await executeQuery('DELETE FROM variantes_productos WHERE producto_id = ?', [id])
      
      // En lugar de eliminar el producto, lo marcamos como "eliminado permanentemente"
      // agregando un timestamp especial y ocultándolo completamente
      const query = `
        UPDATE productos 
        SET 
          eliminado = 1,
          fecha_eliminacion = NOW(),
          activo = 0,
          nombre = CONCAT('[ELIMINADO] ', nombre),
          descripcion = 'Producto eliminado permanentemente'
        WHERE id = ? AND eliminado = 1
      `
      const result = await executeQuery(query, [id]) as any
      
      return result.affectedRows > 0
    } catch (error) {
      console.error('Error eliminando producto permanentemente:', error)
      throw new Error('Error al eliminar producto permanentemente')
    }
  }

  // Obtener productos con stock bajo
  static async obtenerProductosStockBajo(): Promise<Producto[]> {
    const query = `
      SELECT 
        p.*,
        c.nombre as categoria
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.activo = 1 AND p.stock <= p.stock_minimo
      ORDER BY p.stock ASC
    `

    try {
      const result = await executeQuery(query) as Producto[]
      return result
    } catch (error) {
      console.error('Error obteniendo productos con stock bajo:', error)
      throw new Error('Error al obtener productos con stock bajo')
    }
  }

  // Asociar imagen principal a un producto
  static async asociarImagenPrincipal(producto_id: number, url: string): Promise<void> {
    // Marcar cualquier imagen principal anterior como no principal
    await executeQuery(
      'UPDATE imagenes_productos SET es_principal = 0 WHERE producto_id = ? AND es_principal = 1',
      [producto_id]
    );
    // Insertar la nueva imagen como principal
    await executeQuery(
      'INSERT INTO imagenes_productos (producto_id, url, es_principal) VALUES (?, ?, 1)',
      [producto_id, url]
    );
  }

  // Guardar imágenes (batch)
  static async guardarImagenesProducto(producto_id: number, imagenes: Array<{ url: string, color?: string, es_principal?: boolean, orden?: number }>) {
    // Eliminar imágenes existentes del producto
    await executeQuery('DELETE FROM imagenes_productos WHERE producto_id = ?', [producto_id]);
    // Insertar nuevas imágenes
    for (const img of imagenes) {
      await executeQuery(
        'INSERT INTO imagenes_productos (producto_id, color, url, es_principal, orden) VALUES (?, ?, ?, ?, ?)',
        [producto_id, img.color || null, img.url, img.es_principal ? 1 : 0, img.orden || 0]
      );
    }
  }

  // Guardar variantes (batch)
  static async guardarVariantesProducto(producto_id: number, variantes: Array<{ color: string, talla: string, stock: number, activo?: boolean }>) {
    // Eliminar variantes existentes del producto
    await executeQuery('DELETE FROM variantes_productos WHERE producto_id = ?', [producto_id]);
    // Insertar nuevas variantes
    for (const v of variantes) {
      await executeQuery(
        'INSERT INTO variantes_productos (producto_id, color, talla, stock, activo) VALUES (?, ?, ?, ?, ?)',
        [producto_id, v.color, v.talla, v.stock, v.activo !== false ? 1 : 0]
      );
    }
  }

  // Obtener productos para administración (incluye todos los estados)
  static async obtenerProductosAdmin(filtros: any = {}): Promise<{ productos: any[], total: number }> {
    const {
      categoria_id,
      busqueda,
      estado = 'todos', // 'activos', 'inactivos', 'eliminados', 'todos'
      orden = 'fecha',
      pagina = 1,
      limite = 20
    } = filtros

    let whereConditions: string[] = []
    let queryParams: any[] = []

    // Filtro de estado
    switch (estado) {
      case 'activos':
        whereConditions.push('p.activo = 1 AND p.eliminado = 0')
        break
      case 'inactivos':
        whereConditions.push('p.activo = 0 AND p.eliminado = 0')
        break
      case 'eliminados':
        whereConditions.push('p.eliminado = 1')
        break
      default: // 'todos'
        // No agregar filtro de estado
        break
    }

    // Aplicar otros filtros
    if (categoria_id) {
      whereConditions.push('p.categoria_id = ?')
      queryParams.push(categoria_id)
    }

    if (busqueda) {
      whereConditions.push('(p.nombre LIKE ? OR p.descripcion LIKE ?)')
      queryParams.push(`%${busqueda}%`, `%${busqueda}%`)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Determinar orden
    let orderBy = 'p.fecha_creacion DESC'
    switch (orden) {
      case 'nombre':
        orderBy = 'p.nombre ASC'
        break
      case 'precio':
        orderBy = 'p.precio_pen ASC'
        break
      case 'stock':
        orderBy = 'p.stock DESC'
        break
    }

    // Query principal
    const offset = (pagina - 1) * limite
    const query = `
      SELECT 
        p.*,
        p.precio_pen as precio,
        c.nombre as categoria_nombre,
        (SELECT url FROM imagenes_productos ip WHERE ip.producto_id = p.id AND ip.es_principal = 1 LIMIT 1) as imagen_principal,
        CASE 
          WHEN p.eliminado = 1 THEN 'eliminado'
          WHEN p.activo = 0 THEN 'inactivo'
          ELSE 'activo'
        END as estado_producto
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `

    queryParams.push(limite, offset)

    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM productos p
      ${whereClause}
    `

    try {
      const [productos, countResult] = await Promise.all([
        executeQuery(query, queryParams),
        executeQuery(countQuery, queryParams.slice(0, -2)) // Remove limite and offset
      ])

      return {
        productos: productos as any[],
        total: (countResult as any[])[0].total
      }
    } catch (error) {
      console.error('Error al obtener productos para admin:', error)
      throw new Error('Error al obtener productos')
    }
  }
}
