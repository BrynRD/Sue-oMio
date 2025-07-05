import { NextRequest, NextResponse } from 'next/server';
import { UsuarioService } from '@/lib/services/usuario.service';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log('🔍 Testing credentials:', { email, password });
    
    // Obtener usuario por email
    const usuario = await UsuarioService.obtenerPorEmail(email);
    console.log('👤 Usuario encontrado:', usuario ? {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      activo: usuario.activo,
      passwordExists: !!usuario.password
    } : 'No encontrado');
    
    if (!usuario) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no encontrado',
        email: email
      });
    }
    
    if (!usuario.password) {
      return NextResponse.json({
        success: false,
        error: 'Usuario sin contraseña definida',
        email: email
      });
    }
    
    // Verificar contraseña
    const esValida = await bcrypt.compare(password, usuario.password);
    console.log('🔐 Contraseña válida:', esValida);
    
    // Verificar usuario activo
    if (!usuario.activo) {
      return NextResponse.json({
        success: false,
        error: 'Usuario desactivado',
        email: email
      });
    }
    
    return NextResponse.json({
      success: esValida,
      error: esValida ? null : 'Contraseña incorrecta',
      usuario: esValida ? {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol,
        activo: usuario.activo
      } : null
    });
    
  } catch (error) {
    console.error('❌ Error en test de credenciales:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Listar todos los usuarios (sin contraseñas)
    const usuarios = await UsuarioService.obtenerTodos();
    
    return NextResponse.json({
      success: true,
      usuarios: usuarios.map(u => ({
        id: u.id,
        nombre: u.nombre,
        apellido: u.apellido,
        email: u.email,
        rol: u.rol,
        activo: u.activo,
        fecha_registro: u.fecha_registro
      })),
      total: usuarios.length
    });
    
  } catch (error) {
    console.error('❌ Error listando usuarios:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
