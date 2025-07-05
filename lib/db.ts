import mysql from 'mysql2/promise'

// Configuración de la base de datos usando variables de entorno
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sueno_mio_store',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}


const pool = mysql.createPool(dbConfig)


export async function executeQuery(query: string, params: any[] = []) {
  try {
    const [results] = await pool.execute(query, params)
    return results
  } catch (error) {
    console.error('Error ejecutando query:', error)
    throw error
  }
}


export async function getConnection() {
  return await pool.getConnection()
}


export default pool
