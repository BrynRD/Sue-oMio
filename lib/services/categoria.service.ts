import { executeQuery } from '@/lib/db'
import { Categoria } from '@/types'

export class CategoriaService {
  // Obtener todas las categorías activas
  static async obtenerCategorias(incluirConteoProductos: boolean = false): Promise<any[]> {
    let query: string
    
    if (incluirConteoProductos) {
      query = `
        SELECT 
          c.*,
          COUNT(p.id) as productos_count
        FROM categorias c
        LEFT JOIN productos p ON c.id = p.categoria_id AND p.activo = 1
        WHERE c.activo = 1
        GROUP BY c.id
        ORDER BY c.orden ASC, c.nombre ASC
      `
    } else {
      query = `
        SELECT * FROM categorias 
        WHERE activo = 1 
        ORDER BY orden ASC, nombre ASC
      `
    }

    try {
      const result = await executeQuery(query)
      return result as any[]
    } catch (error) {
      console.error('Error obteniendo categorías:', error)
      throw new Error('Error al obtener categorías')
    }
  }

  // Obtener categoría por ID
  static async obtenerCategoriaPorId(id: number): Promise<Categoria | null> {
    const query = 'SELECT * FROM categorias WHERE id = ? AND activo = 1'

    try {
      const result = await executeQuery(query, [id]) as Categoria[]
      return result[0] || null
    } catch (error) {
      console.error('Error obteniendo categoría:', error)
      throw new Error('Error al obtener categoría')
    }
  }

  // Obtener categorías con contador de productos
  static async obtenerCategoriasConContador(): Promise<(Categoria & { total_productos: number })[]> {
    const query = `
      SELECT 
        c.*,
        COUNT(p.id) as total_productos
      FROM categorias c
      LEFT JOIN productos p ON c.id = p.categoria_id AND p.activo = 1
      WHERE c.activo = 1
      GROUP BY c.id
      ORDER BY c.orden ASC, c.nombre ASC
    `

    try {
      const result = await executeQuery(query) as (Categoria & { total_productos: number })[]
      return result
    } catch (error) {
      console.error('Error obteniendo categorías con contador:', error)
      throw new Error('Error al obtener categorías con contador')
    }
  }

  // Crear nueva categoría (para dashboard admin)
  static async crearCategoria(categoria: Omit<Categoria, 'id' | 'fecha_creacion'>): Promise<number> {
    const query = `
      INSERT INTO categorias (nombre, descripcion, imagen, activo, orden)
      VALUES (?, ?, ?, ?, ?)
    `

    try {
      const result = await executeQuery(query, [
        categoria.nombre,
        categoria.descripcion,
        categoria.imagen,
        categoria.activo,
        categoria.orden
      ]) as any

      return result.insertId
    } catch (error) {
      console.error('Error creando categoría:', error)
      throw new Error('Error al crear categoría')
    }
  }

  // Actualizar categoría
  static async actualizarCategoria(id: number, categoria: Partial<Categoria>): Promise<boolean> {
    const campos: string[] = []
    const valores: any[] = []

    // Construir dinámicamente la query UPDATE
    Object.entries(categoria).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'fecha_creacion' && value !== undefined) {
        campos.push(`${key} = ?`)
        valores.push(value)
      }
    })

    if (campos.length === 0) {
      throw new Error('No hay campos para actualizar')
    }

    valores.push(id)

    const query = `UPDATE categorias SET ${campos.join(', ')} WHERE id = ?`

    try {
      const result = await executeQuery(query, valores) as any
      return result.affectedRows > 0
    } catch (error) {
      console.error('Error actualizando categoría:', error)
      throw new Error('Error al actualizar categoría')
    }
  }

  // Eliminar categoría (soft delete)
  static async eliminarCategoria(id: number): Promise<boolean> {
    // Verificar si hay productos en esta categoría
    const checkQuery = 'SELECT COUNT(*) as total FROM productos WHERE categoria_id = ? AND activo = 1'
    const checkResult = await executeQuery(checkQuery, [id]) as { total: number }[]
    
    if (checkResult[0]?.total > 0) {
      throw new Error('No se puede eliminar la categoría porque tiene productos asociados')
    }

    const query = 'UPDATE categorias SET activo = 0 WHERE id = ?'

    try {
      const result = await executeQuery(query, [id]) as any
      return result.affectedRows > 0
    } catch (error) {
      console.error('Error eliminando categoría:', error)
      throw new Error('Error al eliminar categoría')
    }
  }
}
