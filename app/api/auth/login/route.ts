import { NextRequest, NextResponse } from 'next/server';
import { UsuarioService } from '@/lib/services/usuario.service';
import { sign } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sueno-mio-secret-key';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Validación básica
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }
    
    // Verificar credenciales
    const usuario = await UsuarioService.verificarCredenciales(email, password);
    
    if (!usuario) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }
    
    if (!usuario.activo) {
      return NextResponse.json(
        { error: 'Cuenta desactivada' },
        { status: 403 }
      );
    }
    
    // Generar JWT
    const token = sign(
      { 
        id: usuario.id, 
        email: usuario.email, 
        rol: usuario.rol 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Crear respuesta con cookie
    const response = NextResponse.json({
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol
      },
      token
    });
    
    // Establecer cookie HttpOnly
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 días
    });
    
    return response;
  } catch (error) {
    console.error('Error en POST /api/auth/login:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
