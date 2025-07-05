import { verify } from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'sueno-mio-secret-key';

export interface UsuarioAutenticado {
  id: number;
  email: string;
  rol: 'cliente' | 'admin';
}

export function verificarToken(request: NextRequest): UsuarioAutenticado | null {
  try {
    // Buscar token en cookie o header Authorization
    let token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return null;
    }
    
    const decoded = verify(token, JWT_SECRET) as UsuarioAutenticado;
    return decoded;
  } catch (error) {
    console.error('Error al verificar token:', error);
    return null;
  }
}

export function requiereAuth(handler: (request: NextRequest, usuario: UsuarioAutenticado) => Promise<Response>) {
  return async function(request: NextRequest) {
    const usuario = verificarToken(request);
    
    if (!usuario) {
      return new Response(
        JSON.stringify({ error: 'Token de autenticación requerido' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    return handler(request, usuario);
  };
}

export function requiereAdmin(handler: (request: NextRequest, usuario: UsuarioAutenticado) => Promise<Response>) {
  return async function(request: NextRequest) {
    const usuario = verificarToken(request);
    
    if (!usuario) {
      return new Response(
        JSON.stringify({ error: 'Token de autenticación requerido' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (usuario.rol !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Permisos de administrador requeridos' }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    return handler(request, usuario);
  };
}
