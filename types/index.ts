// Tipos de datos para la tienda Sueño Mío

export interface Usuario {
  id: number
  nombre: string
  apellido: string
  email: string
  password?: string
  telefono?: string
  rol: 'cliente' | 'admin'
  activo: boolean
  fecha_registro: Date
}

export interface UsuarioCrear {
  nombre: string
  apellido: string
  email: string
  password: string
  telefono?: string
  rol?: 'cliente' | 'admin'
}

export interface UsuarioActualizar {
  nombre?: string
  apellido?: string
  email?: string
  password?: string
  telefono?: string
  rol?: 'cliente' | 'admin'
  activo?: boolean
}

export interface Categoria {
  id: number
  nombre: string
  descripcion?: string
  imagen?: string
  activo: boolean
  orden: number
  fecha_creacion: Date
}

export interface Producto {
  id: number
  nombre: string
  descripcion?: string
  categoria_id: number
  precio_pen: number
  precio_usd: number
  precio_eur: number
  precio_oferta_pen?: number
  precio_oferta_usd?: number
  precio_oferta_eur?: number
  stock: number
  stock_minimo: number
  peso: number
  genero: 'masculino' | 'femenino' | 'unisex'
  activo: boolean
  eliminado: boolean
  fecha_eliminacion?: Date
  destacado: boolean
  en_oferta: boolean
  fecha_creacion: Date
  fecha_actualizacion: Date
  // Datos adicionales de la vista
  categoria?: string
  categoria_nombre?: string
  imagen_url?: string
  colores_disponibles?: string
  tallas_disponibles?: string
  // Datos procesados para el frontend
  tallas?: string[]
  colores?: string[]
  variantes?: VarianteProducto[]
  imagenes?: string[]
  imagenes_por_color?: Record<string, string>
  imagen_principal?: string
  rating?: number
  reviews?: number
  material?: string
  cuidados?: string
}

export interface VarianteProducto {
  id: number
  producto_id: number
  color?: string
  talla?: string
  stock: number
  sku?: string
  imagen_url?: string // Para compatibilidad hacia atrás
  imagenes?: string[] // Nueva propiedad para múltiples imágenes
  activo: boolean
  fecha_creacion: Date
}

export interface VarianteForm {
  color: string
  talla: string
  stock: number
  sku?: string
  imagen_url?: string
  imagenes?: string[]
}

export interface ImagenProducto {
  id: number
  producto_id: number
  url: string
  alt_text?: string
  es_principal: boolean
  orden: number
  fecha_creacion: Date
}

export interface ItemCarrito {
  id: number
  usuario_id?: number
  session_id?: string
  producto_id: number
  variante_id?: number
  cantidad: number
  moneda: 'PEN' | 'USD' | 'EUR'
  precio_unitario: number
  fecha_agregado: Date
  // Datos adicionales del producto
  producto?: Producto
  variante?: VarianteProducto
}

export interface Pedido {
  id: number
  numero_pedido: string
  usuario_id?: number
  email_cliente?: string
  nombre_cliente?: string
  telefono_cliente?: string
  estado: 'pendiente' | 'confirmado' | 'enviado' | 'entregado' | 'cancelado'
  moneda: 'PEN' | 'USD' | 'EUR'
  subtotal: number
  costo_envio: number
  total: number
  metodo_pago: 'tarjeta' | 'transferencia' | 'efectivo' | 'yape' | 'plin'
  estado_pago: 'pendiente' | 'completado' | 'fallido'
  notas?: string
  fecha_pedido: Date
  fecha_entrega?: Date
  // Datos adicionales
  total_items?: number
}

export interface DetallePedido {
  id: number
  pedido_id: number
  producto_id: number
  variante_id?: number
  nombre_producto: string
  color?: string
  talla?: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export interface DireccionEnvio {
  id: number
  pedido_id: number
  nombre_completo: string
  telefono?: string
  departamento: string
  ciudad: string
  direccion: string
  referencia?: string
}

export interface Direccion {
  id: number
  usuario_id: number
  nombre_completo: string
  telefono?: string
  departamento: string
  ciudad: string
  direccion: string
  referencia?: string
  es_principal: boolean
  fecha_creacion: Date
}

export interface DireccionCrear {
  usuario_id: number
  nombre_completo: string
  telefono?: string
  departamento: string
  ciudad: string
  direccion: string
  referencia?: string
  es_principal?: boolean
}

export interface DireccionActualizar {
  nombre_completo?: string
  telefono?: string
  departamento?: string
  ciudad?: string
  direccion?: string
  referencia?: string
  es_principal?: boolean
}

export interface TasaCambio {
  id: number
  moneda_base: 'PEN' | 'USD' | 'EUR'
  moneda_destino: 'PEN' | 'USD' | 'EUR'
  tasa: number
  fecha_actualizacion: Date
}

export interface Configuracion {
  id: number
  clave: string
  valor?: string
  descripcion?: string
  fecha_actualizacion: Date
}

// Tipos para estadísticas del dashboard
export interface EstadisticasDashboard {
  total_productos: number
  total_clientes: number
  total_pedidos: number
  pedidos_pendientes: number
  ingresos_mes: number
  productos_stock_bajo: number
}

// Tipos para filtros y búsquedas
export interface FiltroProductos {
  categoria_id?: number
  genero?: 'masculino' | 'femenino' | 'unisex'
  precio_min?: number
  precio_max?: number
  moneda?: 'PEN' | 'USD' | 'EUR'
  destacado?: boolean
  en_oferta?: boolean
  busqueda?: string
  orden?: 'precio_asc' | 'precio_desc' | 'nombre' | 'fecha'
  pagina?: number
  limite?: number
}

// Tipo para respuesta paginada
export interface RespuestaPaginada<T> {
  datos: T[]
  total: number
  pagina: number
  limite: number
  total_paginas: number
}
