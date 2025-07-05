import db from '@/lib/db';
import { EstadisticasDashboard } from '@/types';
import { RowDataPacket } from 'mysql2/promise';

export class DashboardService {
  static async obtenerEstadisticas(): Promise<EstadisticasDashboard> {
    try {
      // Obtener estadísticas con consultas directas
      const [totalProductosResult] = await db.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as total FROM productos WHERE activo = 1'
      );
      
      const [totalClientesResult] = await db.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as total FROM usuarios WHERE rol = "cliente" OR rol IS NULL'
      );
      
      const [totalPedidosResult] = await db.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as total FROM pedidos WHERE estado != "cancelado"'
      );
      
      const [pedidosPendientesResult] = await db.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as total FROM pedidos WHERE estado = "pendiente"'
      );
      
      const [ingresosMesResult] = await db.execute<RowDataPacket[]>(
        'SELECT COALESCE(SUM(total), 0) as total FROM pedidos WHERE estado = "entregado" AND MONTH(fecha_pedido) = MONTH(NOW()) AND YEAR(fecha_pedido) = YEAR(NOW())'
      );
      
      const [productosStockBajoResult] = await db.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as total FROM productos WHERE stock <= 5 AND activo = 1'
      );

      // Convertir ingresos_mes a número
      const ingresosMes = parseFloat(ingresosMesResult[0]?.total?.toString() || '0');

      console.log('Estadísticas obtenidas:', {
        total_productos: totalProductosResult[0]?.total || 0,
        total_clientes: totalClientesResult[0]?.total || 0,
        total_pedidos: totalPedidosResult[0]?.total || 0,
        pedidos_pendientes: pedidosPendientesResult[0]?.total || 0,
        ingresos_mes: ingresosMes,
        productos_stock_bajo: productosStockBajoResult[0]?.total || 0
      });

      return {
        total_productos: totalProductosResult[0]?.total || 0,
        total_clientes: totalClientesResult[0]?.total || 0,
        total_pedidos: totalPedidosResult[0]?.total || 0,
        pedidos_pendientes: pedidosPendientesResult[0]?.total || 0,
        ingresos_mes: ingresosMes,
        productos_stock_bajo: productosStockBajoResult[0]?.total || 0
      };
    } catch (error) {
      console.error('Error al obtener estadísticas del dashboard:', error);
      throw error;
    }
  }

  static async obtenerProductosMasVendidos(limite: number = 10): Promise<any[]> {
    try {
      const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT 
           p.id,
           p.nombre,
           p.precio_pen,
           p.stock,
           SUM(dp.cantidad) as total_vendido,
           COUNT(DISTINCT dp.pedido_id) as pedidos_count
         FROM productos p
         INNER JOIN detalles_pedidos dp ON p.id = dp.producto_id
         INNER JOIN pedidos pe ON dp.pedido_id = pe.id
         WHERE pe.estado IN ('confirmado', 'enviado', 'entregado')
         GROUP BY p.id, p.nombre, p.precio_pen, p.stock
         ORDER BY total_vendido DESC
         LIMIT ?`,
        [limite]
      );
      
      return rows;
    } catch (error) {
      console.error('Error al obtener productos más vendidos:', error);
      throw error;
    }
  }

  static async obtenerVentasPorMes(año: number): Promise<any[]> {
    try {
      const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT 
           MONTH(fecha_pedido) as mes,
           MONTHNAME(fecha_pedido) as nombre_mes,
           COUNT(*) as total_pedidos,
           SUM(total) as total_ventas,
           AVG(total) as promedio_venta
         FROM pedidos
         WHERE YEAR(fecha_pedido) = ? 
           AND estado IN ('confirmado', 'enviado', 'entregado')
         GROUP BY MONTH(fecha_pedido), MONTHNAME(fecha_pedido)
         ORDER BY mes`,
        [año]
      );
      
      return rows;
    } catch (error) {
      console.error('Error al obtener ventas por mes:', error);
      throw error;
    }
  }

  static async obtenerPedidosRecientes(limite: number = 10): Promise<any[]> {
    try {
      const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT 
           p.id,
           p.numero_pedido,
           p.estado,
           p.total,
           p.moneda,
           p.fecha_pedido,
           COALESCE(u.nombre, p.nombre_cliente) as nombre_cliente,
           COALESCE(u.email, p.email_cliente) as email_cliente
         FROM pedidos p
         LEFT JOIN usuarios u ON p.usuario_id = u.id
         ORDER BY p.fecha_pedido DESC
         LIMIT ?`,
        [limite]
      );
      
      return rows;
    } catch (error) {
      console.error('Error al obtener pedidos recientes:', error);
      throw error;
    }
  }

  static async obtenerProductosStockBajo(): Promise<any[]> {
    try {
      const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT 
           id,
           nombre,
           stock,
           precio_pen
         FROM productos
         WHERE stock <= 5 AND activo = 1
         ORDER BY stock ASC`
      );
      
      return rows;
    } catch (error) {
      console.error('Error al obtener productos con stock bajo:', error);
      throw error;
    }
  }
}
