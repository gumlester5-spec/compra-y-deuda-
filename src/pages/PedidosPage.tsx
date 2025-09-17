import { useState, useEffect, useMemo } from 'react'
import { type Order, addOrder, updateOrder, deleteOrder, addHistoryLog, db } from '../db'
import { toast, type Toast } from 'react-hot-toast'
import { ref, onValue } from 'firebase/database'
import { FaPlus, FaTimes, FaEdit, FaCheck, FaTrash, FaSearch } from 'react-icons/fa'
import { useGroup } from '../context/GroupContext'

const PedidosPage = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [supplierName, setSupplierName] = useState('')
  const [products, setProducts] = useState('')
  const [amount, setAmount] = useState('')
  const [arrivalDate, setArrivalDate] = useState('')
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [addingToSupplier, setAddingToSupplier] = useState<string | null>(null)

  const { groupId, userName } = useGroup()
  
  useEffect(() => {
    if (!groupId) return
    const ordersRef = ref(db, `groups/${groupId}/orders`)

    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const ordersList: Order[] = Object.keys(data).map(key => ({
          ...data[key],
          id: key,
        }))
        setOrders(ordersList) // La ordenación se hará en el render
      } else {
        setOrders([])
      }
    })

    // Limpiar la suscripción al desmontar el componente
    return () => unsubscribe()
  }, [groupId])

  const handleOpenForm = () => {
    // Limpiamos los campos antes de abrir
    setSupplierName('')
    setProducts('')
    setAmount('')
    // Ponemos la fecha de hoy por defecto para evitar errores
    setArrivalDate(new Date().toISOString().split('T')[0])
    setEditingOrderId(null)
    setAddingToSupplier(null)
    setIsFormVisible(true)
  }

  const handleCloseForm = () => {
    setIsFormVisible(false)
    setEditingOrderId(null)
    setAddingToSupplier(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!supplierName.trim() || !products.trim() || !arrivalDate || !amount.trim() || isNaN(parseFloat(amount))) {
      toast.error('Completa todos los campos, incluyendo un monto válido.')
      return
    }

    if (!groupId) return

    // Para evitar problemas de zona horaria, tratamos la fecha como local
    const localDate = new Date(arrivalDate + 'T00:00:00');
    // Verificamos si la fecha es válida
    if (isNaN(localDate.getTime())) {
      toast.error('La fecha de llegada no es válida.')
      return
    }

    if (editingOrderId) {
      const originalOrder = orders.find((o) => o.id === editingOrderId)
      if (!originalOrder) return

      const updatedOrder: Order = {
        ...originalOrder,
        supplierName: supplierName.trim(),
        products: products.trim(),
        amount: parseFloat(amount),
        arrivalDate: localDate.getTime(),
      }
      await updateOrder(groupId, updatedOrder)
      await addHistoryLog(groupId, userName ?? 'Usuario', `editó el pedido para el proveedor "${updatedOrder.supplierName}" por Q${updatedOrder.amount.toFixed(2)}.`, 'edit')
    } else {
      const newOrderData: Omit<Order, 'id'> = {
        supplierName: (addingToSupplier || supplierName).trim(),
        products: products.trim(),
        amount: parseFloat(amount),
        arrivalDate: localDate.getTime(),
      }

      // Guardamos en la base de datos
      await addOrder(groupId, newOrderData)
      await addHistoryLog(groupId, userName ?? 'Usuario', `agregó el pedido para el proveedor "${newOrderData.supplierName}" por Q${newOrderData.amount.toFixed(2)}.`, 'add')

      toast.success('Pedido agregado')
    }
    handleCloseForm()
  }

  const handleCompleteOrder = (orderId: string) => {
    const orderToComplete = orders.find((order) => order.id === orderId)
    if (!orderToComplete || !groupId) return

    const completeAction = async () => {
      await deleteOrder(groupId, orderId)
      toast.success('Pedido completado')
      await addHistoryLog(groupId, userName ?? 'Usuario', `completó el pedido para "${orderToComplete.supplierName}".`, 'complete')
    }
    toast(
      (t: Toast) => (
        <div className="toast-container">
          <b>¿Pedido completado?</b>
          <p>El pedido se eliminará de la lista.</p>
          <div className="toast-buttons">
            <button
              className="toast-button confirm"
              onClick={() => {
                completeAction()
                toast.dismiss(t.id)
              }}
            >
              Sí, completar
            </button>
            <button className="toast-button cancel" onClick={() => toast.dismiss(t.id)}>
              No
            </button>
          </div>
        </div>
      ),
      { duration: 6000 },
    )
  }

  const handleEdit = (order: Order) => {
    toast('Editando pedido...', { icon: '✍️' })
    setEditingOrderId(order.id)
    setSupplierName(order.supplierName)
    setProducts(order.products)
    setAmount(String(order.amount))
    setIsFormVisible(true)
    setArrivalDate(new Date(order.arrivalDate).toISOString().split('T')[0])
  }

  const handleDelete = (orderId: string) => {
    const orderToDelete = orders.find((order) => order.id === orderId)
    if (!orderToDelete || !groupId) return

    const deleteAction = async () => {
      await deleteOrder(groupId, orderId)
      toast.success('Pedido eliminado')
      await addHistoryLog(groupId, userName ?? 'Usuario', `eliminó el pedido para "${orderToDelete.supplierName}".`, 'delete')
    }

    toast(
      (t: Toast) => (
        <div className="toast-container">
          <b>¿Eliminar este pedido?</b>
          <p>Esta acción no se puede deshacer.</p>
          <div className="toast-buttons">
            <button
              className="toast-button confirm delete"
              onClick={() => {
                deleteAction()
                toast.dismiss(t.id)
              }}
            >
              Eliminar
            </button>
            <button className="toast-button cancel" onClick={() => toast.dismiss(t.id)}>
              No
            </button>
          </div>
        </div>
      ),
      { duration: 6000 },
    )
  }

  const handleAddOrderToSupplier = (supplier: string) => {
    setEditingOrderId(null)
    setAddingToSupplier(supplier) // Indica que estamos agregando a un proveedor existente
    setSupplierName(supplier) // Guarda el nombre para la lógica de envío
    setProducts('')
    setAmount('')
    // Usa la fecha de llegada del primer pedido existente de ese proveedor
    const existingOrder = orders.find(o => o.supplierName === supplier)
    if (existingOrder) {
      setArrivalDate(new Date(existingOrder.arrivalDate).toISOString().split('T')[0])
    }
    setIsFormVisible(true)
  }

  // Agrupamos, filtramos y ordenamos los pedidos usando useMemo para optimización
  const filteredAndSortedGroups = useMemo(() => {
    const groupedOrders = orders.reduce((acc, order) => {
      const supplier = order.supplierName
      if (!acc[supplier]) {
        acc[supplier] = { name: supplier, orders: [], nearestArrival: new Date('2999-12-31'), totalAmount: 0 }
      }
      acc[supplier].orders.push(order)
      acc[supplier].totalAmount += order.amount
      if (new Date(order.arrivalDate) < acc[supplier].nearestArrival) {
        acc[supplier].nearestArrival = new Date(order.arrivalDate)
      }
      // Ordenamos los pedidos dentro de cada grupo aquí
      acc[supplier].orders.sort((a, b) => a.arrivalDate - b.arrivalDate);
      return acc
    }, {} as Record<string, { name: string, orders: Order[], nearestArrival: Date, totalAmount: number }>)

    return Object.values(groupedOrders)
      .filter((group) => group.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.nearestArrival.getTime() - b.nearestArrival.getTime() || a.name.localeCompare(b.name));

  }, [orders, searchTerm]);


  return (
    <>
      {isFormVisible && (
        <div className="modal-overlay" onClick={handleCloseForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit} className="debt-form">
              <div className="modal-header">
                <h2>{editingOrderId ? 'Editar Pedido' : addingToSupplier ? `Añadir a ${addingToSupplier}` : 'Agregar Pedido'}</h2>
                <button type="button" onClick={handleCloseForm} className="close-button" aria-label="Cerrar">
                  <FaTimes />
                </button>
              </div>
              {/* Solo mostrar el campo de proveedor si no estamos añadiendo a uno existente */}
              {!addingToSupplier && (
                <input type="text" placeholder="Nombre del proveedor" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} required />
              )}
              <textarea
                placeholder="Lista de productos..."
                value={products}
                onChange={(e) => setProducts(e.target.value)}
                required
                rows={3}
                className="order-textarea"
              />
              <input
                type="number"
                placeholder="Monto total del pedido"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                step="0.01"
                min="0"
              />
              {/* Solo mostrar el campo de fecha si no estamos añadiendo a uno existente */}
              {!addingToSupplier && (
                <div className="form-field">
                  <label htmlFor="arrivalDate">Fecha de llegada:</label>
                  <input id="arrivalDate" type="date" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} required />
                </div>
              )}
              <div className="form-actions">
                <button type="button" onClick={handleCloseForm} className="cancel-button">Cancelar</button>
                <button type="submit">{editingOrderId ? 'Guardar Cambios' : 'Agregar Pedido'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="fiado-page-layout">
        <div className="fiado-header-sticky">
          <div className="search-bar-container">
            <FaSearch className="search-icon" aria-hidden="true" />
            <input
              type="text"
              placeholder="Buscar proveedor..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <h2>Lista de Pedidos</h2>
        </div>

        <div className="debt-list-scrollable">
          {orders.length === 0 ? (
            <p>No hay pedidos registrados.</p>
          ) : (
            <ul>
              {filteredAndSortedGroups
                .map((group) => (
                  <li key={group.name} className="client-group-item">
                    <details>
                      <summary className="client-summary" onClick={(e) => { if (e.target instanceof HTMLButtonElement) e.preventDefault() }}>
                        <div className="client-name-container">
                          <span className="debtor-name" translate="no">{group.name}</span>
                          <button onClick={() => handleAddOrderToSupplier(group.name)} className="action-button add-to-client" aria-label={`Agregar pedido a ${group.name}`} title={`Agregar pedido a ${group.name}`}>
                            <FaPlus />
                          </button>
                        </div>
                        <span className="debtor-amount" translate="no">Q{group.totalAmount.toFixed(2)}</span>
                      </summary>
                      <div className="debt-details-list">
                        {group.orders.map((order) => (
                          <div key={order.id} className="debt-detail-item">
                            <div className="order-details">
                              <span className="debtor-description">{order.products}</span>
                              <span className="order-date">Llega: {new Date(order.arrivalDate).toLocaleDateString()}</span>
                            </div>
                            <div className="item-actions">
                              <button onClick={() => handleEdit(order)} className="action-button edit" aria-label="Editar"><FaEdit /></button>
                              <button onClick={() => handleCompleteOrder(order.id)} className="action-button paid" aria-label="Completar"><FaCheck /></button>
                              <button onClick={() => handleDelete(order.id)} className="action-button delete" aria-label="Eliminar"><FaTrash /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>

      {/* --- Botón Flotante --- */}
      <button onClick={handleOpenForm} className="fab" aria-label="Agregar pedido">
        <FaPlus />
      </button>
    </>
  )
}

export default PedidosPage