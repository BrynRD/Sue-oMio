'use client'

import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Loader2,
  Camera,
  Link as LinkIcon
} from 'lucide-react'
import Image from 'next/image'

interface SimpleImageUploadProps {
  value?: string
  onChange: (url: string) => void
  label?: string
  className?: string
  disabled?: boolean
}

export default function SimpleImageUpload({
  value = '',
  onChange,
  label = 'Imagen del Producto',
  className = '',
  disabled = false
}: SimpleImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')
  const [useUrl, setUseUrl] = useState(!!value && value.startsWith('http'))
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const resizeImage = useCallback((file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new window.Image()
      
      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo proporción
        let { width, height } = img
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        // Configurar canvas
        canvas.width = width
        canvas.height = height
        
        // Dibujar imagen redimensionada
        ctx?.drawImage(img, 0, 0, width, height)
        
        // Convertir a blob y luego a File
        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            })
            resolve(resizedFile)
          } else {
            resolve(file)
          }
        }, file.type, quality)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }, [])

  const handleFileUpload = useCallback(async (file: File) => {
    setError('')
    
    // Validaciones mejoradas
    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo es muy grande. Máximo 10MB')
      toast({
        title: "Archivo muy grande",
        description: "El archivo debe ser menor a 10MB",
        variant: "destructive"
      })
      return
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setError('Formato no soportado. Usa JPG, PNG, WEBP o GIF')
      toast({
        title: "Formato no válido",
        description: "Solo se permiten archivos JPG, PNG, WEBP o GIF",
        variant: "destructive"
      })
      return
    }

    try {
      setUploading(true)

      // Redimensionar si es muy grande
      let processedFile = file
      if (file.size > 1024 * 1024) { // Si es mayor a 1MB
        toast({
          title: "Optimizando imagen",
          description: "Redimensionando para mejorar rendimiento...",
        })
        processedFile = await resizeImage(file)
      }

      const formData = new FormData()
      formData.append('file', processedFile)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al subir archivo')
      }

      const fileUrl = result.url || result.data?.url
      onChange(fileUrl)
      setUseUrl(false)

      toast({
        title: "✅ Imagen subida",
        description: `Imagen optimizada y subida correctamente${processedFile !== file ? ' (redimensionada)' : ''}`,
        duration: 3000,
      })

    } catch (err) {
      console.error('Error uploading file:', err)
      setError(err instanceof Error ? err.message : 'Error al subir archivo')
      
      toast({
        title: "❌ Error al subir imagen",
        description: err instanceof Error ? err.message : 'Error desconocido',
        variant: "destructive",
        duration: 4000,
      })
    } finally {
      setUploading(false)
    }
  }, [onChange, toast, resizeImage])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }, [handleFileUpload])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  const clearImage = () => {
    onChange('')
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {label && (
        <Label className="text-sm font-medium flex items-center space-x-2">
          <Camera className="h-4 w-4" />
          <span>{label}</span>
        </Label>
      )}

      {/* Botones para cambiar modo */}
      <div className="flex space-x-2">
        <Button
          type="button"
          variant={!useUrl ? "default" : "outline"}
          size="sm"
          onClick={() => setUseUrl(false)}
          disabled={disabled}
        >
          <Upload className="h-4 w-4 mr-1" />
          Subir archivo
        </Button>
        <Button
          type="button"
          variant={useUrl ? "default" : "outline"}
          size="sm"
          onClick={() => setUseUrl(true)}
          disabled={disabled}
        >
          <LinkIcon className="h-4 w-4 mr-1" />
          URL externa
        </Button>
      </div>

      {/* Preview de imagen actual */}
      {value && (
        <Card className="relative p-3">
          <div className="relative w-full h-40 bg-stone-100 rounded-lg overflow-hidden">
            <Image
              src={value}
              alt="Vista previa"
              fill
              className="object-cover"
              onError={() => setError('Error al cargar la imagen')}
            />
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 h-6 w-6 p-0"
                onClick={clearImage}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <p className="text-xs text-stone-600 mt-2 truncate">
            {value}
          </p>
        </Card>
      )}

      {!useUrl ? (
        /* Modo: Subir archivo */
        <Card 
          className={`border-2 border-dashed transition-colors cursor-pointer ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-stone-300 hover:border-stone-400'
          } ${uploading || disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !uploading && !disabled && fileInputRef.current?.click()}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="p-6 text-center">
            <div className="mx-auto w-12 h-12 text-stone-400 mb-4">
              {uploading ? (
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
              ) : (
                <ImageIcon className="w-12 h-12" />
              )}
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-stone-900">
                {uploading ? 'Subiendo imagen...' : 'Arrastra una imagen aquí'}
              </p>
              {!uploading && (
                <>
                  <p className="text-xs text-stone-600">
                    o haz clic para seleccionar un archivo
                  </p>
                  <p className="text-xs text-stone-500">
                    PNG, JPG, WebP hasta 5MB
                  </p>
                </>
              )}
            </div>
          </div>
        </Card>
      ) : (
        /* Modo: URL externa */
        <div className="space-y-2">
          <Label className="text-sm text-stone-600">
            URL de la imagen:
          </Label>
          <Input
            type="url"
            placeholder="https://ejemplo.com/imagen.jpg"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled || uploading}
          />
        </div>
      )}

      {/* Input oculto para archivos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || uploading}
      />

      {/* Mensaje de error */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
          {error}
        </div>
      )}
    </div>
  )
}
