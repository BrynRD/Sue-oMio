import { NextRequest, NextResponse } from 'next/server';
import { UsuarioService } from '@/lib/services/usuario.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID de usuario inválido' },
        { status: 400 }
      );
    }
    
    const usuario = await UsuarioService.obtenerPorId(id);
    
    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(usuario);
  } catch (error) {
    console.error('Error en GET /api/usuarios/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID de usuario inválido' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const actualizado = await UsuarioService.actualizar(id, body);
    
    if (!actualizado) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    const usuario = await UsuarioService.obtenerPorId(id);
    return NextResponse.json(usuario);
  } catch (error) {
    console.error('Error en PUT /api/usuarios/[id]:', error);
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID de usuario inválido' },
        { status: 400 }
      );
    }
    
    const eliminado = await UsuarioService.eliminar(id);
    
    if (!eliminado) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error en DELETE /api/usuarios/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
