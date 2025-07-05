import db from '@/lib/db';
import { Direccion, DireccionCrear, DireccionActualizar } from '@/types';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export class DireccionService {
  static async obtenerPorUsuario(usuarioId: number): Promise<Direccion[]> {
    try {
      const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT id, usuario_id, nombre_completo, telefono, departamento, ciudad, 
                direccion, referencia, es_principal, fecha_creacion 
         FROM direcciones 
         WHERE usuario_id = ? 
         ORDER BY es_principal DESC, id DESC`,
        [usuarioId]
      );
      return rows as Direccion[];
    } catch (error) {
      console.error('Error al obtener direcciones por usuario:', error);
      throw error;
    }
  }

  static async obtenerPorId(id: number): Promise<Direccion | null> {
    try {
      const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT id, usuario_id, nombre_completo, telefono, departamento, ciudad, 
                direccion, referencia, es_principal, fecha_creacion 
         FROM direcciones 
         WHERE id = ?`,
        [id]
      );
      
      if (rows.length === 0) return null;
      return rows[0] as Direccion;
    } catch (error) {
      console.error('Error al obtener dirección por ID:', error);
      throw error;
    }
  }

  static async crear(direccion: DireccionCrear): Promise<number> {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Si es principal, desmarcar las demás direcciones principales del usuario
      if (direccion.es_principal) {
        await connection.execute(
          'UPDATE direcciones SET es_principal = 0 WHERE usuario_id = ?',
          [direccion.usuario_id]
        );
      }
      
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO direcciones (usuario_id, nombre_completo, telefono, departamento, 
                                ciudad, direccion, referencia, es_principal) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          direccion.usuario_id,
          direccion.nombre_completo,
          direccion.telefono || null,
          direccion.departamento,
          direccion.ciudad,
          direccion.direccion,
          direccion.referencia || null,
          direccion.es_principal || false
        ]
      );
      
      await connection.commit();
      return result.insertId;
    } catch (error) {
      await connection.rollback();
      console.error('Error al crear dirección:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async actualizar(id: number, direccion: DireccionActualizar): Promise<boolean> {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Obtener la dirección actual para saber el usuario_id
      const [direccionActual] = await connection.execute<RowDataPacket[]>(
        'SELECT usuario_id FROM direcciones WHERE id = ?',
        [id]
      );
      
      if (direccionActual.length === 0) {
        await connection.rollback();
        return false;
      }
      
      const usuarioId = direccionActual[0].usuario_id;
      
      // Si es principal, desmarcar las demás direcciones principales del usuario
      if (direccion.es_principal) {
        await connection.execute(
          'UPDATE direcciones SET es_principal = 0 WHERE usuario_id = ? AND id != ?',
          [usuarioId, id]
        );
      }
      
      const campos = [];
      const valores = [];
      
      if (direccion.nombre_completo !== undefined) {
        campos.push('nombre_completo = ?');
        valores.push(direccion.nombre_completo);
      }
      
      if (direccion.telefono !== undefined) {
        campos.push('telefono = ?');
        valores.push(direccion.telefono);
      }
      
      if (direccion.departamento !== undefined) {
        campos.push('departamento = ?');
        valores.push(direccion.departamento);
      }
      
      if (direccion.ciudad !== undefined) {
        campos.push('ciudad = ?');
        valores.push(direccion.ciudad);
      }
      
      if (direccion.direccion !== undefined) {
        campos.push('direccion = ?');
        valores.push(direccion.direccion);
      }
      
      if (direccion.referencia !== undefined) {
        campos.push('referencia = ?');
        valores.push(direccion.referencia);
      }
      
      if (direccion.es_principal !== undefined) {
        campos.push('es_principal = ?');
        valores.push(direccion.es_principal);
      }
      
      if (campos.length === 0) {
        await connection.rollback();
        return false;
      }
      
      valores.push(id);
      
      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE direcciones SET ${campos.join(', ')} WHERE id = ?`,
        valores
      );
      
      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      console.error('Error al actualizar dirección:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async eliminar(id: number): Promise<boolean> {
    try {
      const [result] = await db.execute<ResultSetHeader>(
        'DELETE FROM direcciones WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error al eliminar dirección:', error);
      throw error;
    }
  }

  static async establecerComoPrincipal(id: number): Promise<boolean> {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Obtener el usuario_id de la dirección
      const [direccion] = await connection.execute<RowDataPacket[]>(
        'SELECT usuario_id FROM direcciones WHERE id = ?',
        [id]
      );
      
      if (direccion.length === 0) {
        await connection.rollback();
        return false;
      }
      
      const usuarioId = direccion[0].usuario_id;
      
      // Desmarcar todas las direcciones principales del usuario
      await connection.execute(
        'UPDATE direcciones SET es_principal = 0 WHERE usuario_id = ?',
        [usuarioId]
      );
      
      // Marcar esta dirección como principal
      const [result] = await connection.execute<ResultSetHeader>(
        'UPDATE direcciones SET es_principal = 1 WHERE id = ?',
        [id]
      );
      
      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      console.error('Error al establecer dirección como principal:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}
