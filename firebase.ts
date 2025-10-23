import { vi } from 'vitest'

// Hacemos un mock de la instancia 'db' para que no intente conectarse a la base de datos real.
// Simplemente la exportamos como un objeto vacío o con funciones mockeadas si es necesario.
export const db = {}

// Mockeamos las funciones que usamos de 'firebase/database'
export const getDatabase = vi.fn()
export const ref = vi.fn()
export const set = vi.fn()
// ... y así sucesivamente para otras funciones que uses como push, update, remove, get.