import { useState, useEffect, useMemo } from 'react'
import { type PurchaseItem, addPurchase, updatePurchase, deletePurchase, addHistoryLog, type PurchasePriority, db } from '../db'
import { toast, type Toast } from 'react-hot-toast'
import { FaPlus, FaTimes, FaEdit, FaTrash, FaCheck, FaSearch } from 'react-icons/fa'
import { useGroup } from '../context/GroupContext'
import { ref, onValue } from 'firebase/database'

const ComprasPage = () => {
  const [items, setItems] = useState<PurchaseItem[]>([])
  const [name, setName] = useState('')
  const [supplier, setSupplier] = useState('')
  const [priority, setPriority] = useState<PurchasePriority>('media')
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [addingToSupplier, setAddingToSupplier] = useState<string | null>(null)

  const { groupId, userName } = useGroup()

  useEffect(() => {
    if (!groupId) return
    const purchasesRef = ref(db, `groups/${groupId}/purchases`)

    const unsubscribe = onValue(purchasesRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const purchasesList: PurchaseItem[] = Object.keys(data).map(key => ({
          ...data[key],
          id: key,
        }))
        setItems(purchasesList)
      } else {
        setItems([])
      }
    })

    return () => unsubscribe()
  }, [groupId])

  const handleOpenForm = () => {
    // Limpiamos los campos antes de abrir
    setName('')
    setEditingItemId(null)
    setSupplier('')
    setAddingToSupplier(null)
    setPriority('media')
    setIsFormVisible(true)
  }

  const handleCloseForm = () => {
    setIsFormVisible(false)
    setEditingItemId(null)
    setAddingToSupplier(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!groupId) return

    // La validación del proveedor sigue funcionando porque el estado 'supplier' se rellena en ambos casos.
    if (!name.trim() || !supplier.trim()) {
      toast.error('Por favor, ingresa datos válidos.')
      return
    }

    if (editingItemId) {
      const originalItem = items.find((i) => i.id === editingItemId)
      if (!originalItem) return

      const updatedItem: PurchaseItem = {
        ...originalItem,
        name: name.trim(),
        supplier: supplier.trim(),
        priority,
      }
      await updatePurchase(groupId, updatedItem)
      toast.success('Compra actualizada')
      await addHistoryLog(groupId, userName ?? 'Usuario', `editó la compra "${updatedItem.name}".`, 'edit')
    } else {
      const newItemData: Omit<PurchaseItem, 'id'> = {
        name: name.trim(),
        supplier: supplier.trim(),
        priority,
      }

      await addPurchase(groupId, newItemData)

      toast.success('Compra agregada')
      await addHistoryLog(groupId, userName ?? 'Usuario', `agregó la compra "${newItemData.name}".`, 'add')
    }

    // Limpiar y cerrar el formulario
    handleCloseForm()
  }

  const handleEdit = (item: PurchaseItem) => {
    toast('Editando compra...', { icon: '✍️' })
    setEditingItemId(item.id)
    setName(item.name)
    setSupplier(item.supplier)
    setPriority(item.priority)
    setIsFormVisible(true)
  }

  const handleMarkAsOrdered = (id: string) => {
    const itemToOrder = items.find((i) => i.id === id)
    if (!itemToOrder || !groupId) return

    toast.promise(
      deletePurchase(groupId, id).then(() => {
        addHistoryLog(groupId, userName ?? 'Usuario', `marcó como pedida la compra "${itemToOrder.name}".`, 'complete')
      }),
      {
        loading: 'Marcando...',
        success: 'Marcado como pedido',
        error: 'Error al marcar',
      },
    )
  }

  const handleDelete = (id: string) => {
    const itemToDelete = items.find((i) => i.id === id)
    if (!itemToDelete || !groupId) return

    const deleteAction = async () => {
      await deletePurchase(groupId, id)
      toast.success('Compra eliminada')
      await addHistoryLog(groupId, userName ?? 'Usuario', `eliminó la compra "${itemToDelete.name}".`, 'delete')
    }

    toast(
      (t: Toast) => (
        <div className="toast-container">
          <b>¿Eliminar esta compra?</b>
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

  const handleAddProductToSupplier = (supplierName: string) => {
    setEditingItemId(null)
    setAddingToSupplier(supplierName)
    setName('')
    setSupplier(supplierName) // Pre-rellena el proveedor
    setPriority('media')
    setIsFormVisible(true)
  }

  const priorityOrder: Record<PurchasePriority, number> = { alta: 1, media: 2, baja: 3 }

  const filteredAndSortedGroups = useMemo(() => {
    const groupedItems = items.reduce((acc, item) => {
      const supplierName = item.supplier
      if (!acc[supplierName]) {
        acc[supplierName] = { name: supplierName, items: [], highestPriority: 3 }
      }
      acc[supplierName].items.push(item)
      const itemPriority = priorityOrder[item.priority]
      if (itemPriority < acc[supplierName].highestPriority) {
        acc[supplierName].highestPriority = itemPriority
      }
      return acc
    }, {} as Record<string, { name: string, items: PurchaseItem[], highestPriority: number }>)

    return Object.values(groupedItems)
      .filter((group) => group.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.highestPriority - b.highestPriority || a.name.localeCompare(b.name))
  }, [items, searchTerm])

  return (
    <>
      {isFormVisible && (
        <div className="modal-overlay" onClick={handleCloseForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit} className="debt-form">
              <div className="modal-header">
                <h2>{editingItemId ? 'Editar Compra' : addingToSupplier ? `Añadir a ${addingToSupplier}` : 'Agregar Compra'}</h2>
                <button type="button" onClick={handleCloseForm} className="close-button" aria-label="Cerrar">
                  <FaTimes />
                </button>
              </div>
              <input type="text" placeholder="Nombre del producto" value={name} onChange={(e) => setName(e.target.value)} required />
              {!addingToSupplier && (
                <input type="text" placeholder="Proveedor" value={supplier} onChange={(e) => setSupplier(e.target.value)} required />
              )}
              <div className="priority-selector">
                <label>Prioridad:</label>
                <div className="priority-buttons">
                  {(['baja', 'media', 'alta'] as PurchasePriority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`priority-button ${priority === p ? 'active' : ''} ${p}`}
                      onClick={() => setPriority(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={handleCloseForm} className="cancel-button">Cancelar</button>
                <button type="submit">{editingItemId ? 'Guardar Cambios' : 'Agregar'}</button>
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
          <h2>Lista de Compras</h2>
        </div>

        <div className="debt-list-scrollable">
          {items.length === 0 ? (
            <p>No hay compras pendientes.</p>
          ) : filteredAndSortedGroups.length === 0 ? (
            <p>No se encontraron compras con ese criterio de búsqueda.</p>
          ) : (
            <ul>
              {filteredAndSortedGroups.map((group) => (
                  <li key={group.name} className="client-group-item">
                    <details>
                      <summary className="client-summary" onClick={(e) => { if (e.target instanceof HTMLButtonElement) e.preventDefault() }}>
                        <div className="client-name-container">
                          <span className="debtor-name" translate="no">{group.name}</span>
                          <button onClick={() => handleAddProductToSupplier(group.name)} className="action-button add-to-client" aria-label={`Agregar producto a ${group.name}`} title={`Agregar producto a ${group.name}`}>
                            <FaPlus />
                          </button>
                        </div>
                        <span className="debtor-amount" translate="no">{group.items.length} prod.</span>
                      </summary>
                      <div className="debt-details-list">
                        {group.items.map((item) => (
                          <div key={item.id} className="debt-detail-item">
                            <span className="debtor-description">{item.name}</span>
                            <div className="item-actions">
                              <span className={`priority-tag ${item.priority}`}>{item.priority}</span>
                              <button onClick={() => handleEdit(item)} className="action-button edit" aria-label="Editar"><FaEdit /></button>
                              <button onClick={() => handleMarkAsOrdered(item.id)} className="action-button paid" aria-label="Marcar como pedido"><FaCheck /></button>
                              <button onClick={() => handleDelete(item.id)} className="action-button delete" aria-label="Eliminar"><FaTrash /></button>
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
      <button onClick={handleOpenForm} className="fab" aria-label="Agregar compra">
        <FaPlus />
      </button>
    </>
  )
}

export default ComprasPage