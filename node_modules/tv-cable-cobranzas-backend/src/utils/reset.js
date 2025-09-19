import { unlinkSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { seedDatabase } from './seeder.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DB_FILE = join(__dirname, '../../db.json')

const resetDatabase = () => {
  console.log('🔄 Reseteando base de datos...')

  // Eliminar archivo existente si existe
  if (existsSync(DB_FILE)) {
    try {
      unlinkSync(DB_FILE)
      console.log('✅ Archivo de base de datos anterior eliminado')
    } catch (error) {
      console.error('❌ Error eliminando archivo anterior:', error.message)
      process.exit(1)
    }
  }

  // Recrear base de datos con datos frescos
  console.log('🌱 Recreando base de datos con datos frescos...')
  seedDatabase()
  console.log('✅ Base de datos reseteada exitosamente')
}

// Ejecutar reset si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  resetDatabase()
}

export { resetDatabase }