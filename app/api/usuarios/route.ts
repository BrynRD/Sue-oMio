import { NextRequest, NextResponse } from 'next/server';
import { UsuarioService } from '@/lib/services/usuario.service';

export async function GET() {
  try {
    const usuarios = await UsuarioService.obtenerTodos();
    return NextResponse.json(usuarios);
  } catch (error) {
    console.error('Error en GET /api/usuarios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validación básica
    if (!body.nombre || !body.apellido || !body.email || !body.password) {
      return NextResponse.json(
        { error: 'Nombre, apellido, email y contraseña son requeridos' },
        { status: 400 }
      );
    }
    
    const usuarioId = await UsuarioService.crear(body);
    const usuario = await UsuarioService.obtenerPorId(usuarioId);
    
    return NextResponse.json(usuario, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/usuarios:', error);
    
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
