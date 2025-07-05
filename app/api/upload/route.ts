import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No se encontró archivo' }, { status: 400 })
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Tipo de archivo no válido. Solo se permiten: JPEG, PNG, WebP, GIF' 
      }, { status: 400 })
    }

    // Validar tamaño (10MB máximo)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'El archivo es muy grande. Máximo 10MB' 
      }, { status: 400 })
    }

    // Validar nombre de archivo
    if (file.name.length > 255) {
      return NextResponse.json({ 
        error: 'Nombre de archivo muy largo' 
      }, { status: 400 })
    }

    // Crear directorio de uploads si no existe
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 15)
    const extension = path.extname(file.name).toLowerCase()
    const safeName = file.name.replace(extension, '').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)
    const filename = `${timestamp}-${randomSuffix}-${safeName}${extension}`
    const filepath = path.join(uploadDir, filename)

    // Convertir archivo a buffer y guardarlo
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Verificar que es realmente una imagen
    const fileSignature = buffer.toString('hex', 0, 4)
    const validSignatures = {
      'ffd8ffe0': 'jpg',
      'ffd8ffe1': 'jpg', 
      'ffd8ffe2': 'jpg',
      'ffd8ffe3': 'jpg',
      'ffd8ffe8': 'jpg',
      '89504e47': 'png',
      '52494646': 'webp',
      '47494638': 'gif'
    }
    
    if (!Object.keys(validSignatures).some(sig => fileSignature.startsWith(sig))) {
      return NextResponse.json({ 
        error: 'El archivo no es una imagen válida' 
      }, { status: 400 })
    }
    
    await writeFile(filepath, buffer)

    // Retornar URL pública del archivo
    const publicUrl = `/uploads/${filename}`

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: filename,
      originalName: file.name,
      size: file.size,
      type: file.type
    })

  } catch (error) {
    console.error('Error al subir archivo:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

// Configuración de Next.js para manejar archivos grandes
export const config = {
  api: {
    bodyParser: false,
  },
}
