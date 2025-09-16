import { useState, useEffect } from 'react'
import { type Debtor, addDebtor, deleteDebtor, updateDebtor, addHistoryLog, db } from '../db'
import { FaEdit, FaTrash, FaCheck, FaPlus, FaTimes, FaSearch } from 'react-icons/fa'
import { ref, onValue } from 'firebase/database'
import { toast, type Toast } from 'react-hot-toast'
import { useGroup } from '../context/GroupContext'

const FiadoPage = () => {
  // Estado para la lista de deudores
  const [debtors, setDebtors] = useState<Debtor[]>([])
  // Nuevo estado para controlar qué deuda se está editando
  const [editingDebtorId, setEditingDebtorId] = useState<string | null>(null)
  // Nuevo estado para controlar la visibilidad del formulario
  const [isFormVisible, setIsFormVisible] = useState(false)
  // Estado para los campos del formulario
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  // Nuevo estado para el término de búsqueda
  const [searchTerm, setSearchTerm] = useState('')
  // Estado para saber si estamos añadiendo a un cliente existente
  const [addingToClientName, setAddingToClientName] = useState<string | null>(null)

  const { groupId, userName } = useGroup()

  // Cargar los datos de IndexedDB cuando el componente se monta
  useEffect(() => {
    if (!groupId) return
    const debtorsRef = ref(db, `groups/${groupId}/debtors`)

    // onValue se suscribe a los cambios en 'debtors' en tiempo real
    const unsubscribe = onValue(debtorsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const debtorsList: Debtor[] = Object.keys(data).map(key => ({
          ...data[key],
          id: key,
        }))
        debtorsList.sort((a, b) => b.date - a.date) // Ordenar por timestamp
        setDebtors(debtorsList)
      } else {
        setDebtors([])
      }
    })

    // Devolvemos la función de limpieza para desuscribirnos cuando el componente se desmonte
    return () => unsubscribe()
  }, [groupId])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    // Validaciones básicas
    if (!name.trim() || !description.trim() || !amount.trim() || isNaN(parseFloat(amount))) {
      toast.error('Por favor, completa todos los campos.')
      return
    }

    if (!groupId) return

    // Lógica para ACTUALIZAR una deuda existente
    if (editingDebtorId) {
      const originalDebtor = debtors.find((d) => d.id === editingDebtorId)
      if (!originalDebtor) return

      const updatedDebtor: Debtor = {
        ...originalDebtor,
        name: name.trim(),
        description: description.trim(),
        amount: parseFloat(amount),
        date: Date.now(), // Actualizamos la fecha a la de la modificación
      }

      await updateDebtor(groupId, updatedDebtor)
      toast.success('Deuda actualizada con éxito')
      await addHistoryLog(groupId, userName ?? 'Usuario', `editó la deuda de "${updatedDebtor.name}".`, 'edit')
    } else {
      // Lógica para CREAR una nueva deuda (la que ya teníamos)
      const newDebtorData: Omit<Debtor, 'id'> = {
        name: name.trim(),
        description: description.trim(),
        amount: parseFloat(amount),
        date: Date.now(),
      }
      await addDebtor(groupId, newDebtorData)
      toast.success('Deuda agregada con éxito')
      await addHistoryLog(groupId, userName ?? 'Usuario', `agregó la deuda de "${newDebtorData.name}" por Q${newDebtorData.amount.toFixed(2)}.`, 'add')
    }

    // Limpiamos el formulario y salimos del modo edición
    setEditingDebtorId(null)
    setName('')
    setDescription('')
    setAmount('')
    setIsFormVisible(false) // Ocultamos el formulario
  }

  const handleEdit = (debtor: Debtor) => {
    toast('Editando deuda...', { icon: '✍️' })
    setEditingDebtorId(debtor.id)
    setName(debtor.name)
    setDescription(debtor.description)
    setAmount(String(debtor.amount)) // El input espera un string
    setIsFormVisible(true) // Mostramos el formulario para editar
  }

  const handleAddDebtToClient = (clientName: string) => {
    // Abre el formulario para una nueva deuda, pre-rellenando el nombre.
    setEditingDebtorId(null)
    setAddingToClientName(clientName)
    setName(clientName)
    setDescription('')
    setAmount('')
    setIsFormVisible(true)
  }

  const handleOpenForm = () => {
    // Limpiamos el formulario y salimos del modo edición
    setEditingDebtorId(null)
    setAddingToClientName(null)
    setName('')
    setDescription('')
    setAmount('')
    setIsFormVisible(true)
  }

  const handleCloseForm = () => {
    setIsFormVisible(false)
    setEditingDebtorId(null)
    setAddingToClientName(null)
  }

  const handleMarkAsPaid = (id: string) => {
    toast(
      (t: Toast) => (
        <div className="toast-container">
          <span>¿Marcar esta deuda como pagada?</span>
          <div className="toast-buttons">
            <button
              className="toast-button confirm"
              onClick={() => {
                if (!groupId) return
                const debtorToPay = debtors.find(d => d.id === id);
                if (debtorToPay) {
                  addHistoryLog(groupId, userName ?? 'Usuario', `pagó la deuda de "${debtorToPay.name}" por Q${debtorToPay.amount.toFixed(2)}.`, 'paid')
                  handleDelete(id, false) // false para no pedir doble confirmación
                }
                toast.dismiss(t.id)
              }}
            >
              Sí, pagar
            </button>
            <button className="toast-button cancel" onClick={() => toast.dismiss(t.id)}>
              No
            </button>
          </div>
        </div>
      ),
      { duration: 6000 }
    )
  }

  const handleDelete = async (id: string, withConfirmation = true) => {
    const debtorToDelete = debtors.find(d => d.id === id);
    if (!debtorToDelete || !groupId) return;

    const deleteAction = async () => {
      await deleteDebtor(groupId, id)

      // Solo registrar como "eliminada" si no fue una acción de "pagar"
      if (withConfirmation) {
        toast.success('Deuda eliminada')
        await addHistoryLog(groupId, userName ?? 'Usuario', `eliminó la deuda de "${debtorToDelete.name}".`, 'delete')
      } else {
        toast.success('Marcado como pagado exitosamente')
      }
    }

    if (withConfirmation) {
      toast(
        (t: Toast) => (
          <div className="toast-container">
            <b>¿Eliminar esta deuda?</b>
            <p>Esta acción no se puede deshacer.</p>
            <div className="toast-buttons">
              <button className="toast-button confirm delete" onClick={() => { deleteAction(); toast.dismiss(t.id) }}>Eliminar</button>
              <button className="toast-button cancel" onClick={() => toast.dismiss(t.id)}>No</button>
            </div>
          </div>
        ),
        { duration: 6000 }
      )
    } else {
      await deleteAction()
    }
  }

  // Calculamos el total adeudado
  const totalDebt = debtors.reduce((sum, debtor) => sum + debtor.amount, 0)

  // Agrupamos las deudas por cliente
  const groupedDebts = debtors.reduce((acc, debt) => {
    const clientName = debt.name;
    if (!acc[clientName]) {
      acc[clientName] = {
        name: clientName,
        totalAmount: 0,
        debts: [],
        lastDebtDate: 0
      };
    }
    acc[clientName].debts.push(debt);
    acc[clientName].totalAmount += debt.amount;
    if (debt.date > acc[clientName].lastDebtDate) {
      acc[clientName].lastDebtDate = debt.date;
    }
    return acc;
  }, {} as Record<string, { name: string; totalAmount: number; debts: Debtor[]; lastDebtDate: number }>)

  // Convertimos el objeto agrupado en un array y lo filtramos y ordenamos
  const filteredAndSortedGroups = Object.values(groupedDebts)
    .filter(group => group.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.lastDebtDate - a.lastDebtDate)

  return (
    <div className="fiado-page-layout">
      <div className="fiado-header-sticky">
        {/* --- Buscador --- */}
        <div className="search-bar-container">
          <FaSearch className="search-icon" aria-hidden="true" />
          <input
            type="text"
            placeholder="Buscar cliente..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <h2>Lista de Deudores</h2>
      </div>

      {/* --- Modal con el Formulario (sin cambios) --- */}
      {isFormVisible &&
        <div className="modal-overlay" onClick={handleCloseForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit} className="debt-form">
              <div className="modal-header">
                <h2>{editingDebtorId ? 'Editar Deuda' : addingToClientName ? `Añadir fiado a ${addingToClientName}` : 'Agregar Deudor'}</h2>
                <button type="button" onClick={handleCloseForm} className="close-button" aria-label="Cerrar">
                  <FaTimes />
                </button>
              </div>
              {!addingToClientName && (
                <input type="text" placeholder="Nombre del cliente" value={name} onChange={(e) => setName(e.target.value)} required />
              )}
              <textarea placeholder="Producto/Descripción" value={description} onChange={(e) => setDescription(e.target.value)} required rows={2} className="debt-textarea" />
              <input type="number" placeholder="Monto total" value={amount} onChange={(e) => setAmount(e.target.value)} required step="0.01" min="0" />
              <div className="form-actions">
                <button type="button" onClick={handleCloseForm} className="cancel-button">Cancelar</button>
                <button type="submit">{editingDebtorId ? 'Guardar Cambios' : 'Agregar'}</button>
              </div>
            </form>
          </div>
        </div>
      }

      <div className="debt-list-scrollable">
        {debtors.length === 0 ? (
          <p>No hay deudores registrados.</p>
        ) : filteredAndSortedGroups.length === 0 ? (
          <p>No se encontraron deudas con ese criterio de búsqueda.</p>
        ) : (
          <ul>
            {filteredAndSortedGroups.map((group) => (
              <li key={group.name} className="client-group-item">
                <details>
                  <summary className="client-summary" onClick={(e) => { if (e.target instanceof HTMLButtonElement) e.preventDefault() }}>
                    <div className="client-name-container">
                      <span className="debtor-name" translate="no">{group.name}</span>
                      <button onClick={() => handleAddDebtToClient(group.name)} className="action-button add-to-client" aria-label={`Agregar fiado a ${group.name}`} title={`Agregar fiado a ${group.name}`}>
                        <FaPlus />
                      </button>
                    </div>
                    <span className="debtor-amount" translate="no">Q{group.totalAmount.toFixed(2)}</span>
                  </summary>
                  <div className="debt-details-list">
                    {group.debts.map(debt => (
                      <div key={debt.id} className="debt-detail-item">
                        <div className="debtor-info">
                          <span className="debtor-description">{debt.description}</span>
                          <span className="debtor-date">{new Date(debt.date).toLocaleString()}</span>
                        </div>
                        <div className="item-actions">
                           <button onClick={() => handleEdit(debt)} className="action-button edit" aria-label="Editar"><FaEdit /></button>
                           <button onClick={() => handleMarkAsPaid(debt.id)} className="action-button paid" aria-label="Marcar como pagado"><FaCheck /></button>
                           <button onClick={() => handleDelete(debt.id)} className="action-button delete" aria-label="Eliminar"><FaTrash /></button>
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

      {debtors.length > 0 && (
        <div className="total-debt-card" translate="no">
          <span>Total Adeudado:</span>
          <strong>Q{totalDebt.toFixed(2)}</strong>
        </div>
      )}

      {/* --- Botón Flotante --- */}
      <button onClick={handleOpenForm} className="fab" aria-label="Agregar fiado">
        <FaPlus />
      </button>
    </div>
  )
}

export default FiadoPage