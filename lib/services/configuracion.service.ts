import db from '@/lib/db';
import { TasaCambio, Configuracion } from '@/types';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export class ConfiguracionService {
  // Tasas de cambio
  static async obtenerTasasCambio(): Promise<TasaCambio[]> {
    try {
      const [rows] = await db.execute<RowDataPacket[]>(
        'SELECT * FROM tasas_cambio ORDER BY moneda_base, moneda_destino'
      );
      return rows as TasaCambio[];
    } catch (error) {
      console.error('Error al obtener tasas de cambio:', error);
      throw error;
    }
  }

  static async obtenerTasaCambio(
    monedaBase: 'PEN' | 'USD' | 'EUR',
    monedaDestino: 'PEN' | 'USD' | 'EUR'
  ): Promise<number> {
    try {
      if (monedaBase === monedaDestino) return 1;
      
      const [rows] = await db.execute<RowDataPacket[]>(
        'SELECT tasa FROM tasas_cambio WHERE moneda_base = ? AND moneda_destino = ?',
        [monedaBase, monedaDestino]
      );
      
      if (rows.length === 0) {
        throw new Error(`Tasa de cambio no encontrada: ${monedaBase} -> ${monedaDestino}`);
      }
      
      return rows[0].tasa;
    } catch (error) {
      console.error('Error al obtener tasa de cambio específica:', error);
      throw error;
    }
  }

  static async actualizarTasaCambio(
    monedaBase: 'PEN' | 'USD' | 'EUR',
    monedaDestino: 'PEN' | 'USD' | 'EUR',
    tasa: number
  ): Promise<boolean> {
    try {
      const [result] = await db.execute<ResultSetHeader>(
        `INSERT INTO tasas_cambio (moneda_base, moneda_destino, tasa) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE tasa = VALUES(tasa), fecha_actualizacion = CURRENT_TIMESTAMP`,
        [monedaBase, monedaDestino, tasa]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error al actualizar tasa de cambio:', error);
      throw error;
    }
  }

  // Configuración general
  static async obtenerConfiguracion(): Promise<Record<string, string>> {
    try {
      const [rows] = await db.execute<RowDataPacket[]>(
        'SELECT clave, valor FROM configuracion'
      );
      
      const config: Record<string, string> = {};
      rows.forEach((row: any) => {
        config[row.clave] = row.valor;
      });
      
      return config;
    } catch (error) {
      console.error('Error al obtener configuración:', error);
      throw error;
    }
  }

  static async obtenerConfiguracionPorClave(clave: string): Promise<string | null> {
    try {
      const [rows] = await db.execute<RowDataPacket[]>(
        'SELECT valor FROM configuracion WHERE clave = ?',
        [clave]
      );
      
      return rows.length > 0 ? rows[0].valor : null;
    } catch (error) {
      console.error('Error al obtener configuración por clave:', error);
      throw error;
    }
  }

  static async establecerConfiguracion(clave: string, valor: string): Promise<boolean> {
    try {
      const [result] = await db.execute<ResultSetHeader>(
        `INSERT INTO configuracion (clave, valor) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE valor = VALUES(valor), fecha_actualizacion = CURRENT_TIMESTAMP`,
        [clave, valor]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error al establecer configuración:', error);
      throw error;
    }
  }

  // Funciones de conversión de precios
  static async convertirPrecio(
    precio: number,
    monedaOrigen: 'PEN' | 'USD' | 'EUR',
    monedaDestino: 'PEN' | 'USD' | 'EUR'
  ): Promise<number> {
    try {
      if (monedaOrigen === monedaDestino) return precio;
      
      const tasa = await this.obtenerTasaCambio(monedaOrigen, monedaDestino);
      return Math.round((precio * tasa) * 100) / 100; // Redondear a 2 decimales
    } catch (error) {
      console.error('Error al convertir precio:', error);
      throw error;
    }
  }

  // Métodos de configuración específicos para la tienda
  static async obtenerMonedaPrincipal(): Promise<'PEN' | 'USD' | 'EUR'> {
    try {
      const moneda = await this.obtenerConfiguracionPorClave('moneda_principal');
      return (moneda as 'PEN' | 'USD' | 'EUR') || 'PEN';
    } catch (error) {
      console.error('Error al obtener moneda principal:', error);
      return 'PEN';
    }
  }

  static async obtenerCostosEnvio(): Promise<{ lima: number; provincias: number; gratis_desde: number }> {
    try {
      const [lima, provincias, gratisDesde] = await Promise.all([
        this.obtenerConfiguracionPorClave('costo_envio_lima'),
        this.obtenerConfiguracionPorClave('costo_envio_provincias'),
        this.obtenerConfiguracionPorClave('envio_gratis_desde')
      ]);
      
      return {
        lima: parseFloat(lima || '15.00'),
        provincias: parseFloat(provincias || '25.00'),
        gratis_desde: parseFloat(gratisDesde || '200.00')
      };
    } catch (error) {
      console.error('Error al obtener costos de envío:', error);
      return { lima: 15.00, provincias: 25.00, gratis_desde: 200.00 };
    }
  }

  static async obtenerIGV(): Promise<number> {
    try {
      const igv = await this.obtenerConfiguracionPorClave('iva_peru');
      return parseFloat(igv || '18') / 100;
    } catch (error) {
      console.error('Error al obtener IGV:', error);
      return 0.18;
    }
  }
}
