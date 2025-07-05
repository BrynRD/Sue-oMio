'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  Palette,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit
} from 'lucide-react'
import MultiImageUpload from '@/components/MultiImageUpload'
import Image from 'next/image'

interface ImagenesPorColor {
  id?: number
  producto_id: number
  color: string
  imagen_principal?: string
  imagenes: string[]
  activo: boolean
}

interface Props {
  productoId: number
  coloresDisponibles: string[]
  onUpdate?: () => void
}

export default function GestorImagenesPorColor({ 
  productoId, 
  coloresDisponibles, 
  onUpdate 
}: Props) {
  const [imagenesPorColor, setImagenesPorColor] = useState<ImagenesPorColor[]>([])
  const [editandoColor, setEditandoColor] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    cargarImagenesPorColor()
  }, [productoId])

  const cargarImagenesPorColor = async () => {
    try {
      setCargando(true)
      const response = await fetch(`/api/productos/${productoId}/imagenes-color`)
      
      if (response.ok) {
        const data = await response.json()
        setImagenesPorColor(data)
      }
    } catch (error) {
      console.error('Error al cargar imágenes por color:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las imágenes por color",
        variant: "destructive"
      })
    } finally {
      setCargando(false)
    }
  }

  const guardarImagenesColor = async (color: string, imagenes: string[]) => {
    try {
      const imagenPrincipal = imagenes.length > 0 ? imagenes[0] : null
      
      const response = await fetch(`/api/productos/${productoId}/imagenes-color`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          color,
          imagen_principal: imagenPrincipal,
          imagenes
        })
      })

      if (response.ok) {
        await cargarImagenesPorColor()
        setEditandoColor(null)
        onUpdate?.()
        
        toast({
          title: "✅ Imágenes guardadas",
          description: `Imágenes del color ${color} actualizadas correctamente`,
        })
      } else {
        throw new Error('Error al guardar')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar las imágenes",
        variant: "destructive"
      })
    }
  }

  const eliminarImagenesColor = async (color: string) => {
    if (!confirm(`¿Eliminar todas las imágenes del color ${color}?`)) return

    try {
      const response = await fetch(`/api/productos/${productoId}/imagenes-color/${color}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await cargarImagenesPorColor()
        onUpdate?.()
        
        toast({
          title: "Imágenes eliminadas",
          description: `Se eliminaron las imágenes del color ${color}`,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron eliminar las imágenes",
        variant: "destructive"
      })
    }
  }

  const coloresSinImagenes = coloresDisponibles.filter(color => 
    !imagenesPorColor.some(img => img.color === color)
  )

  if (cargando) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-stone-800"></div>
            <span className="ml-2">Cargando imágenes...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg font-light">
            <Palette className="h-5 w-5 mr-2" />
            Gestión de Imágenes por Color
          </CardTitle>
          <p className="text-sm text-stone-600">
            Cada color del producto puede tener múltiples imágenes. 
            Todas las tallas del mismo color comparten las mismas imágenes.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Colores existentes con imágenes */}
          {imagenesPorColor.map((colorData) => (
            <div key={colorData.color} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-6 h-6 rounded-full border border-stone-300"
                    style={{ 
                      backgroundColor: getColorHex(colorData.color)
                    }}
                  />
                  <h3 className="font-medium">{colorData.color}</h3>
                  <Badge variant="outline">
                    {colorData.imagenes.length} imagen{colorData.imagenes.length !== 1 ? 'es' : ''}
                  </Badge>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditandoColor(colorData.color)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => eliminarImagenesColor(colorData.color)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {editandoColor === colorData.color ? (
                <div className="space-y-4">
                  <MultiImageUpload
                    value={colorData.imagenes}
                    onChange={(imagenes) => guardarImagenesColor(colorData.color, imagenes)}
                    label={`Imágenes para ${colorData.color}`}
                    maxImages={8}
                  />
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditandoColor(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {colorData.imagenes.map((url, index) => (
                    <div key={index} className="relative aspect-square">
                      <Image
                        src={url}
                        alt={`${colorData.color} ${index + 1}`}
                        fill
                        className="object-cover rounded border"
                      />
                      {index === 0 && (
                        <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                          Principal
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Agregar nuevo color */}
          {coloresSinImagenes.length > 0 && (
            <div className="border-2 border-dashed border-stone-300 rounded-lg p-6">
              <div className="text-center">
                <ImageIcon className="h-8 w-8 text-stone-400 mx-auto mb-2" />
                <h3 className="font-medium text-stone-700 mb-2">
                  Agregar imágenes para colores
                </h3>
                <p className="text-sm text-stone-500 mb-4">
                  Colores disponibles sin imágenes: {coloresSinImagenes.join(', ')}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {coloresSinImagenes.map((color) => (
                    <Button
                      key={color}
                      variant="outline"
                      size="sm"
                      onClick={() => setEditandoColor(color)}
                      className="flex items-center space-x-2"
                    >
                      <div 
                        className="w-4 h-4 rounded-full border border-stone-300"
                        style={{ backgroundColor: getColorHex(color) }}
                      />
                      <span>{color}</span>
                      <Plus className="h-3 w-3" />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Editor para nuevo color */}
          {editandoColor && coloresSinImagenes.includes(editandoColor) && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <div 
                    className="w-5 h-5 rounded-full border border-stone-300 mr-2"
                    style={{ backgroundColor: getColorHex(editandoColor) }}
                  />
                  Agregar imágenes para {editandoColor}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MultiImageUpload
                  value={[]}
                  onChange={(imagenes) => guardarImagenesColor(editandoColor, imagenes)}
                  label={`Imágenes para ${editandoColor}`}
                  maxImages={8}
                />
                <div className="flex space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditandoColor(null)}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Palette className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">💡 Cómo funciona:</p>
              <ul className="space-y-1 text-xs">
                <li>• <strong>Un color = Una galería</strong>: Todas las tallas del mismo color usan las mismas imágenes</li>
                <li>• <strong>Imagen principal</strong>: La primera imagen se muestra en el catálogo</li>
                <li>• <strong>Galería completa</strong>: Se muestra en la página del producto al seleccionar el color</li>
                <li>• <strong>Optimización</strong>: Evita duplicar imágenes para diferentes tallas del mismo color</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Función helper para obtener colores hex
function getColorHex(colorName: string): string {
  const colores: Record<string, string> = {
    'Blanco': '#ffffff',
    'Negro': '#000000',
    'Gris': '#9ca3af',
    'Azul': '#3b82f6',
    'Rojo': '#ef4444',
    'Verde': '#22c55e',
    'Amarillo': '#eab308',
    'Rosa': '#ec4899',
    'Morado': '#a855f7',
    'Naranja': '#f97316',
    'Beige': '#d6d3d1',
    'Marrón': '#a3a3a3'
  }
  return colores[colorName] || '#6b7280'
}
