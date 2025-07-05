import { NextRequest, NextResponse } from 'next/server';
import { UsuarioService } from '@/lib/services/usuario.service';
import { sign } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sueno-mio-secret-key';

export async function POST(request: NextRequest) {
  try {
    const { nombre, apellido, email, password, telefono } = await request.json();
    
    // Validación básica
    if (!nombre || !apellido || !email || !password) {
      return NextResponse.json(
        { error: 'Nombre, apellido, email y contraseña son requeridos' },
        { status: 400 }
      );
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }
    
    // Validar longitud de contraseña
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }
    
    // Crear usuario
    const usuarioId = await UsuarioService.crear({
      nombre,
      apellido,
      email,
      password,
      telefono,
      rol: 'cliente'
    });
    
    const usuario = await UsuarioService.obtenerPorId(usuarioId);
    
    if (!usuario) {
      throw new Error('Error al crear usuario');
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
    }, { status: 201 });
    
    // Establecer cookie HttpOnly
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 días
    });
    
    return response;
  } catch (error) {
    console.error('Error en POST /api/auth/registro:', error);
    
    // Error de email duplicado
    if (error instanceof Error && error.message.includes('Duplicate entry')) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
