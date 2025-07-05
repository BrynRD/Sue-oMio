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
  Link as LinkIcon,
  Plus,
  Move
} from 'lucide-react'
import Image from 'next/image'

interface MultiImageUploadProps {
  value?: string[]
  onChange: (urls: string[]) => void
  label?: string
  className?: string
  disabled?: boolean
  maxImages?: number
}

export default function MultiImageUpload({
  value = [],
  onChange,
  label = 'Imágenes del Producto',
  className = '',
  disabled = false,
  maxImages = 5
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')
  const [useUrl, setUseUrl] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileUpload = useCallback(async (files: FileList) => {
    setError('')
    
    const validFiles = Array.from(files).filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: `${file.name} es mayor a 5MB`,
          variant: "destructive"
        })
        return false
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Tipo de archivo inválido",
          description: `${file.name} no es una imagen válida`,
          variant: "destructive"
        })
        return false
      }

      return true
    })

    if (value.length + validFiles.length > maxImages) {
      toast({
        title: "Límite de imágenes",
        description: `Máximo ${maxImages} imágenes permitidas`,
        variant: "destructive"
      })
      return
    }

    if (validFiles.length === 0) return

    setUploading(true)

    try {
      const uploadPromises = validFiles.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Error al subir ${file.name}`)
        }

        const data = await response.json()
        return data.url
      })

      const newUrls = await Promise.all(uploadPromises)
      onChange([...value, ...newUrls])

      toast({
        title: "Imágenes subidas",
        description: `${newUrls.length} imagen(es) subida(s) correctamente`,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al subir las imágenes'
      setError(message)
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }, [value, onChange, maxImages, toast])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (disabled || uploading) return

      const files = e.dataTransfer.files
      if (files && files.length > 0) {
        handleFileUpload(files)
      }
    },
    [disabled, uploading, handleFileUpload]
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files)
    }
  }

  const removeImage = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index)
    onChange(newUrls)
  }

  const addUrlImage = () => {
    if (!urlInput.trim()) return

    if (value.length >= maxImages) {
      toast({
        title: "Límite de imágenes",
        description: `Máximo ${maxImages} imágenes permitidas`,
        variant: "destructive"
      })
      return
    }

    onChange([...value, urlInput.trim()])
    setUrlInput('')
    setUseUrl(false)
    
    toast({
      title: "Imagen agregada",
      description: "URL de imagen agregada correctamente",
    })
  }

  const reorderImages = (fromIndex: number, toIndex: number) => {
    const newUrls = [...value]
    const [movedItem] = newUrls.splice(fromIndex, 1)
    newUrls.splice(toIndex, 0, movedItem)
    onChange(newUrls)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setUseUrl(!useUrl)}
            disabled={disabled || uploading}
          >
            <LinkIcon className="h-4 w-4 mr-1" />
            URL
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading || value.length >= maxImages}
          >
            <Upload className="h-4 w-4 mr-1" />
            Subir
          </Button>
        </div>
      </div>

      {/* Área de Drop */}
      <Card
        className={`relative border-2 border-dashed transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-stone-300 hover:border-stone-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
      >
        <div className="p-6 text-center">
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
              <p className="text-sm text-stone-600">Subiendo imágenes...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Camera className="h-8 w-8 text-stone-400 mb-2" />
              <p className="text-sm font-medium text-stone-700 mb-1">
                Arrastra imágenes aquí o haz click para seleccionar
              </p>
              <p className="text-xs text-stone-500">
                PNG, JPG, WEBP hasta 5MB ({value.length}/{maxImages} imágenes)
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Input de archivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      {/* Input de URL */}
      {useUrl && (
        <div className="flex space-x-2">
          <Input
            placeholder="https://ejemplo.com/imagen.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            disabled={disabled}
          />
          <Button
            type="button"
            onClick={addUrlImage}
            disabled={disabled || !urlInput.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Vista previa de imágenes */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {value.map((url, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square relative overflow-hidden rounded-lg border border-stone-200">
                <Image
                  src={url}
                  alt={`Imagen ${index + 1}`}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                {index === 0 && (
                  <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                    Principal
                  </div>
                )}
              </div>
              
              {/* Controles */}
              <div className="absolute -top-2 -right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {index > 0 && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => reorderImages(index, index - 1)}
                    title="Mover hacia adelante"
                  >
                    <Move className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => removeImage(index)}
                  disabled={disabled}
                  title="Eliminar imagen"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
          {error}
        </div>
      )}
    </div>
  )
}
