'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  File, 
  AlertCircle 
} from 'lucide-react'
import Image from 'next/image'

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void
  maxImages?: number
  maxSizeInMB?: number
  acceptedFormats?: string[]
  currentImages?: string[]
}

export default function ImageUpload({
  onImageUploaded,
  maxImages = 5,
  maxSizeInMB = 5,
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  currentImages = []
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[]>(currentImages)

  const validateFile = (file: File): string | null => {
    // Validar tipo de archivo
    if (!acceptedFormats.includes(file.type)) {
      return `Formato no válido. Solo se permiten: ${acceptedFormats.map(f => f.split('/')[1]).join(', ')}`
    }

    // Validar tamaño
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024
    if (file.size > maxSizeInBytes) {
      return `El archivo es muy grande. Máximo ${maxSizeInMB}MB`
    }

    return null
  }

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al subir archivo')
    }

    const data = await response.json()
    return data.url
  }

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    if (previewImages.length + files.length > maxImages) {
      setError(`Máximo ${maxImages} imágenes permitidas`)
      return
    }

    setError('')
    setUploading(true)
    setProgress(0)

    try {
      const uploadPromises = Array.from(files).map(async (file, index) => {
        const validationError = validateFile(file)
        if (validationError) {
          throw new Error(validationError)
        }

        // Crear preview local
        const objectUrl = URL.createObjectURL(file)
        setPreviewImages(prev => [...prev, objectUrl])

        // Subir archivo
        const imageUrl = await uploadFile(file)
        
        // Actualizar progreso
        setProgress(((index + 1) / files.length) * 100)
        
        return imageUrl
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      
      // Limpiar previews locales y usar URLs reales
      setPreviewImages(prev => {
        const newImages = [...currentImages]
        uploadedUrls.forEach(url => {
          newImages.push(url)
          onImageUploaded(url)
        })
        return newImages
      })

    } catch (error) {
      console.error('Error al subir imagen:', error)
      setError(error instanceof Error ? error.message : 'Error al subir imagen')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }, [previewImages.length, maxImages, onImageUploaded, currentImages])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files)
    }
  }, [handleFileSelect])

  const removeImage = (index: number) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index))
  }

  const canUploadMore = previewImages.length < maxImages

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {canUploadMore && (
        <Card className={`border-2 border-dashed transition-colors ${
          dragActive ? 'border-stone-400 bg-stone-50' : 'border-stone-200'
        }`}>
          <CardContent className="p-6">
            <div
              className="text-center"
              onDrag={handleDrag}
              onDragStart={handleDrag}
              onDragEnd={handleDrag}
              onDragOver={handleDragIn}
              onDragEnter={handleDragIn}
              onDragLeave={handleDragOut}
              onDrop={handleDrop}
            >
              <ImageIcon className="mx-auto h-12 w-12 text-stone-400 mb-4" />
              <h3 className="mb-2 text-sm font-medium text-stone-700">
                Subir imágenes
              </h3>
              <p className="mb-4 text-sm text-stone-500">
                Arrastra y suelta o haz clic para seleccionar
              </p>
              <p className="mb-4 text-xs text-stone-400">
                Máximo {maxImages} imágenes, {maxSizeInMB}MB cada una
              </p>
              
              <input
                type="file"
                multiple
                accept={acceptedFormats.join(',')}
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={uploading}
                className="w-full sm:w-auto"
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? 'Subiendo...' : 'Seleccionar Archivos'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Bar */}
      {uploading && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <File className="h-4 w-4 text-stone-500" />
              <div className="flex-1">
                <Progress value={progress} className="h-2" />
              </div>
              <span className="text-sm text-stone-500">{Math.round(progress)}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Preview Images */}
      {previewImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {previewImages.map((imageUrl, index) => (
            <Card key={index} className="relative group overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square relative">
                  <Image
                    src={imageUrl}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Image Count */}
      {previewImages.length > 0 && (
        <p className="text-sm text-stone-500 text-center">
          {previewImages.length} de {maxImages} imágenes
        </p>
      )}
    </div>
  )
}
