import { db } from './firebase' // Importamos la instancia de la base de datos de Firebase
import { ref, set, push, update, remove, get } from 'firebase/database'

// Re-exportamos `db` para que otros archivos puedan usarla directamente
export { db }

// 1. Definimos la estructura de nuestros datos
export interface Debtor {
  id: string
  name: string
  description: string
  amount: number
  date: number // Usaremos timestamps (números) para las fechas
}

export type PurchasePriority = 'baja' | 'media' | 'alta'

export interface PurchaseItem {
  id: string
  name: string
  supplier: string
  priority: PurchasePriority
}

export interface Order {
  id: string
  supplierName: string
  products: string
  amount: number
  arrivalDate: number // Usaremos timestamps (números) para las fechas
}

export type HistoryAction = 'add' | 'edit' | 'delete' | 'paid' | 'complete'

export interface HistoryLog {
  id: string
  userName: string
  message: string
  date: number // Usaremos timestamps (números) para las fechas
  action: HistoryAction
}

// Las funciones ahora interactuarán con Firebase Realtime Database

// --- Funciones de Grupo ---

const generateGroupId = (): string => {
  return Math.floor(100000000 + Math.random() * 900000000).toString()
}

export const createGroup = async (userId: string, userName: string): Promise<string> => {
  let newGroupId: string
  let groupRef
  let snapshot

  // Bucle para garantizar que el ID del grupo sea único.
  // Es extremadamente improbable que colisione, pero esto lo hace 100% seguro.
  do {
    newGroupId = generateGroupId()
    // Apuntamos a 'members' para la comprobación, ya que es públicamente legible
    // según tus reglas. Si no existe, la lectura dará null.
    groupRef = ref(db, `groups/${newGroupId}/members`)
    snapshot = await get(groupRef)
  } while (snapshot.exists())

  // Paso 1: Asegurar la membresía.
  // Escribimos en el nodo 'members' primero. La regla de seguridad lo permite.
  const memberRef = ref(db, `groups/${newGroupId}/members/${userId}`)
  // Usamos 'true' como valor simple para la membresía, como en tu ejemplo.
  // Si prefieres guardar el nombre y la fecha, puedes usar el objeto comentado.
  await set(memberRef, { name: userName, joinedAt: Date.now() })
  // await set(memberRef, true)

  // Paso 2: Escribir el resto de la información del grupo.
  // Como el usuario ya es miembro, esta operación de 'update' será permitida.
  const groupInfoRef = ref(db, `groups/${newGroupId}`) // Apuntamos a la raíz del grupo
  await update(groupInfoRef, {
    info: {
      createdAt: Date.now(),
      owner: userId,
    },
  })

  return newGroupId
}

export const joinGroup = async (groupId: string, userId: string, userName: string): Promise<boolean> => {
  // Apuntamos directamente a la lista de miembros para verificar si el grupo existe.
  const groupMembersRef = ref(db, `groups/${groupId}/members`)
  const snapshot = await get(groupMembersRef)

  if (snapshot.exists()) {
    // Si el grupo existe, añadimos al nuevo usuario a la lista de miembros.
    const newMemberRef = ref(db, `groups/${groupId}/members/${userId}`)
    await set(newMemberRef, { name: userName, joinedAt: Date.now() })
    return true
  }
  return false
}

// Funciones para Deudores
export const addDebtor = async (groupId: string, debtorData: Omit<Debtor, 'id'>) => {
  const newDebtorRef = push(ref(db, `groups/${groupId}/debtors`))
  await set(newDebtorRef, { ...debtorData, id: newDebtorRef.key })
  return newDebtorRef.key
}

export const updateDebtor = async (groupId: string, debtor: Debtor) => {
  const { id, ...debtorData } = debtor
  return update(ref(db, `groups/${groupId}/debtors/${id}`), debtorData)
}

export const deleteDebtor = async (groupId: string, id: string) => {
  return remove(ref(db, `groups/${groupId}/debtors/${id}`))
}

// NOTA: getDebtors ya no se usará. Los componentes se suscribirán directamente a los cambios.

// Funciones para Compras
export const addPurchase = async (groupId: string, purchaseData: Omit<PurchaseItem, 'id'>) => {
  const newPurchaseRef = push(ref(db, `groups/${groupId}/purchases`))
  await set(newPurchaseRef, { ...purchaseData, id: newPurchaseRef.key })
  return newPurchaseRef.key
}

export const updatePurchase = async (groupId: string, purchase: PurchaseItem) => {
  const { id, ...purchaseData } = purchase
  return update(ref(db, `groups/${groupId}/purchases/${id}`), purchaseData)
}

export const deletePurchase = async (groupId: string, id: string) => {
  return remove(ref(db, `groups/${groupId}/purchases/${id}`))
}

// Funciones para Pedidos
export const addOrder = async (groupId: string, orderData: Omit<Order, 'id'>) => {
  const newOrderRef = push(ref(db, `groups/${groupId}/orders`))
  await set(newOrderRef, { ...orderData, id: newOrderRef.key })
  return newOrderRef.key
}

export const updateOrder = async (groupId: string, order: Order) => {
  const { id, ...orderData } = order
  return update(ref(db, `groups/${groupId}/orders/${id}`), orderData)
}

export const deleteOrder = async (groupId: string, id: string) => {
  return remove(ref(db, `groups/${groupId}/orders/${id}`))
}

// Funciones para el Historial
export const addHistoryLog = async (groupId: string, userName: string, message: string, action: HistoryAction) => {
  const newLogRef = push(ref(db, `groups/${groupId}/history`))
  const logData: Omit<HistoryLog, 'id'> = { userName, message, action, date: Date.now() }
  return set(newLogRef, logData)
}