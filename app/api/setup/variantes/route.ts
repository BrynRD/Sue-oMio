import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

// API para verificar y crear las columnas necesarias para variantes
export async function GET() {
  try {
    // Verificar si las columnas existen y crearlas si no
    await createVariantesColumns()
    
    return NextResponse.json({
      success: true,
      message: 'Columnas de variantes verificadas/creadas correctamente'
    })
  } catch (error) {
    console.error('Error configurando variantes:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al configurar variantes' 
      },
      { status: 500 }
    )
  }
}

async function createVariantesColumns() {
  try {
    // Verificar si ya existe la columna sku en variantes_productos
    const checkSkuColumn = `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'sueno_mio_store' 
      AND TABLE_NAME = 'variantes_productos' 
      AND COLUMN_NAME = 'sku'
    `
    
    const skuExists = await executeQuery(checkSkuColumn) as any[]
    
    if (!skuExists || skuExists.length === 0) {
      // Agregar columna sku
      await executeQuery(`
        ALTER TABLE variantes_productos 
        ADD COLUMN sku VARCHAR(50) NULL AFTER stock
      `)
      console.log('Columna SKU agregada')
    }

    // Verificar si ya existe la columna imagen_url en variantes_productos
    const checkImageColumn = `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'sueno_mio_store' 
      AND TABLE_NAME = 'variantes_productos' 
      AND COLUMN_NAME = 'imagen_url'
    `
    
    const imageExists = await executeQuery(checkImageColumn) as any[]
    
    if (!imageExists || imageExists.length === 0) {
      // Agregar columna imagen_url
      await executeQuery(`
        ALTER TABLE variantes_productos 
        ADD COLUMN imagen_url VARCHAR(500) NULL AFTER sku
      `)
      console.log('Columna imagen_url agregada')
    }

    // Verificar si ya existe la columna variante_id en imagenes_productos
    const checkVarianteIdColumn = `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'sueno_mio_store' 
      AND TABLE_NAME = 'imagenes_productos' 
      AND COLUMN_NAME = 'variante_id'
    `
    
    const varianteIdExists = await executeQuery(checkVarianteIdColumn) as any[]
    
    if (!varianteIdExists || varianteIdExists.length === 0) {
      // Agregar columna variante_id
      await executeQuery(`
        ALTER TABLE imagenes_productos 
        ADD COLUMN variante_id INT NULL AFTER producto_id
      `)
      console.log('Columna variante_id agregada')
      
      // Agregar foreign key
      await executeQuery(`
        ALTER TABLE imagenes_productos 
        ADD FOREIGN KEY (variante_id) REFERENCES variantes_productos(id) ON DELETE CASCADE
      `)
      console.log('Foreign key agregada')
    }

    // Crear índices si no existen
    try {
      await executeQuery(`CREATE INDEX idx_variantes_sku ON variantes_productos(sku)`)
    } catch (e) {
      // Índice ya existe, ignorar
    }

    try {
      await executeQuery(`CREATE INDEX idx_imagenes_variante ON imagenes_productos(variante_id)`)
    } catch (e) {
      // Índice ya existe, ignorar
    }

  } catch (error) {
    console.error('Error creando columnas:', error)
    throw error
  }
}
