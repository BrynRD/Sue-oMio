import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { executeQuery } from './db'

interface UsuarioAuth {
  id: number
  email: string
  rol: string
}

interface AuthResult {
  success: boolean
  usuario?: UsuarioAuth
  error?: string
}

export async function verificarAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Obtener el token del header Authorization
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

    if (!token) {
      return { success: false, error: 'Token no proporcionado' }
    }

    // Verificar el token
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      
      // Verificar que el usuario existe en la base de datos
      const usuario = await executeQuery(
        'SELECT id, email, rol FROM usuarios WHERE id = ? AND activo = 1',
        [decoded.id]
      ) as any[]

      if (!usuario || usuario.length === 0) {
        return { success: false, error: 'Usuario no encontrado' }
      }

      return {
        success: true,
        usuario: {
          id: usuario[0].id,
          email: usuario[0].email,
          rol: usuario[0].rol
        }
      }
    } catch (jwtError) {
      return { success: false, error: 'Token inválido' }
    }

  } catch (error) {
    console.error('Error en verificarAuth:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}
