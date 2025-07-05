import db from '@/lib/db';
import { Usuario, UsuarioCrear, UsuarioActualizar } from '@/types';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import bcrypt from 'bcryptjs';

export class UsuarioService {
  static async obtenerTodos(): Promise<Usuario[]> {
    try {
      const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT id, nombre, apellido, email, telefono, rol, activo, fecha_registro 
         FROM usuarios 
         ORDER BY fecha_registro DESC`
      );
      return rows as Usuario[];
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }
  }

  static async obtenerPorId(id: number): Promise<Usuario | null> {
    try {
      const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT id, nombre, apellido, email, telefono, rol, activo, fecha_registro 
         FROM usuarios 
         WHERE id = ?`,
        [id]
      );
      
      if (rows.length === 0) return null;
      return rows[0] as Usuario;
    } catch (error) {
      console.error('Error al obtener usuario por ID:', error);
      throw error;
    }
  }

  static async obtenerPorEmail(email: string): Promise<Usuario | null> {
    try {
      const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT id, nombre, apellido, email, telefono, rol, activo, fecha_registro, password 
         FROM usuarios 
         WHERE email = ? AND activo = 1`,
        [email]
      );
      
      if (rows.length === 0) return null;
      return rows[0] as Usuario;
    } catch (error) {
      console.error('Error al obtener usuario por email:', error);
      throw error;
    }
  }

  static async crear(usuario: UsuarioCrear): Promise<number> {
    try {
      // Encriptar la contraseña
      const passwordHash = await bcrypt.hash(usuario.password, 10);
      
      const [result] = await db.execute<ResultSetHeader>(
        `INSERT INTO usuarios (nombre, apellido, email, password, telefono, rol) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          usuario.nombre,
          usuario.apellido,
          usuario.email,
          passwordHash,
          usuario.telefono || null,
          usuario.rol || 'cliente'
        ]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
  }

  static async actualizar(id: number, usuario: UsuarioActualizar): Promise<boolean> {
    try {
      const campos = [];
      const valores = [];
      
      if (usuario.nombre !== undefined) {
        campos.push('nombre = ?');
        valores.push(usuario.nombre);
      }
      
      if (usuario.apellido !== undefined) {
        campos.push('apellido = ?');
        valores.push(usuario.apellido);
      }
      
      if (usuario.email !== undefined) {
        campos.push('email = ?');
        valores.push(usuario.email);
      }
      
      if (usuario.telefono !== undefined) {
        campos.push('telefono = ?');
        valores.push(usuario.telefono);
      }
      
      if (usuario.rol !== undefined) {
        campos.push('rol = ?');
        valores.push(usuario.rol);
      }
      
      if (usuario.activo !== undefined) {
        campos.push('activo = ?');
        valores.push(usuario.activo);
      }
      
      if (usuario.password !== undefined) {
        const passwordHash = await bcrypt.hash(usuario.password, 10);
        campos.push('password = ?');
        valores.push(passwordHash);
      }
      
      if (campos.length === 0) return false;
      
      valores.push(id);
      
      const [result] = await db.execute<ResultSetHeader>(
        `UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?`,
        valores
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      throw error;
    }
  }

  static async eliminar(id: number): Promise<boolean> {
    try {
      const [result] = await db.execute<ResultSetHeader>(
        'UPDATE usuarios SET activo = 0 WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      throw error;
    }
  }

  static async verificarCredenciales(email: string, password: string): Promise<Usuario | null> {
    try {
      const usuario = await this.obtenerPorEmail(email);
      if (!usuario || !usuario.password) return null;
      
      const esValida = await bcrypt.compare(password, usuario.password);
      if (!esValida) return null;
      
      // Remover password del objeto retornado
      const { password: _, ...usuarioSinPassword } = usuario;
      return usuarioSinPassword;
    } catch (error) {
      console.error('Error al verificar credenciales:', error);
      throw error;
    }
  }

  static async obtenerClientes(): Promise<Usuario[]> {
    try {
      const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT id, nombre, apellido, email, telefono, activo, fecha_registro 
         FROM usuarios 
         WHERE rol = 'cliente' 
         ORDER BY fecha_registro DESC`
      );
      return rows as Usuario[];
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      throw error;
    }
  }
}
