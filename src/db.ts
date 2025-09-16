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

export const createGroup = async (userName: string): Promise<string> => {
  let newGroupId: string
  let groupRef
  let snapshot

  // Bucle para garantizar que el ID del grupo sea único.
  // Es extremadamente improbable que colisione, pero esto lo hace 100% seguro.
  do {
    newGroupId = generateGroupId()
    groupRef = ref(db, `groups/${newGroupId}`)
    snapshot = await get(groupRef)
  } while (snapshot.exists())

  const groupData = {
    info: {
      createdAt: Date.now(),
    },
  }

  await set(groupRef, groupData)

  const membersRef = ref(db, `groups/${newGroupId}/members`)
  await set(push(membersRef), { name: userName })

  return newGroupId
}

export const joinGroup = async (groupId: string, userName: string): Promise<boolean> => {
  const groupRef = ref(db, `groups/${groupId}`)
  const snapshot = await get(groupRef)

  if (snapshot.exists()) {
    const membersRef = ref(db, `groups/${groupId}/members`)
    const newMemberRef = push(membersRef)
    await set(newMemberRef, { name: userName })
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