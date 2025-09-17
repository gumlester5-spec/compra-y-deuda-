import { useState, useEffect, useMemo } from 'react'
import { type HistoryLog, type HistoryAction, db } from '../db'
import { FaPlus, FaEdit, FaTrash, FaCheck, FaBoxOpen, FaSearch } from 'react-icons/fa'
import { useGroup } from '../context/GroupContext'
import { ref, onValue } from 'firebase/database'

const ActionIcon = ({ action }: { action: HistoryAction }) => {
  switch (action) {
    case 'add':
      return <FaPlus className="history-icon add" />
    case 'edit':
      return <FaEdit className="history-icon edit" />
    case 'delete':
      return <FaTrash className="history-icon delete" />
    case 'paid':
      return <FaCheck className="history-icon paid" />
    case 'complete':
      return <FaBoxOpen className="history-icon complete" />
    default:
      return null
  }
}

const HistorialPage = () => {
  type FilterKey = 'todos' | 'fiado' | 'compra' | 'pedido'
  const [logs, setLogs] = useState<HistoryLog[]>([])
  const [activeFilter, setActiveFilter] = useState<FilterKey>('todos')
  const [searchTerm, setSearchTerm] = useState('')
  const { groupId } = useGroup()

  useEffect(() => {
    if (!groupId) return
    const historyRef = ref(db, `groups/${groupId}/history`)

    const unsubscribe = onValue(historyRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const logsList: HistoryLog[] = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        }))
        // Ordenar por fecha, del más nuevo al más antiguo
        logsList.sort((a, b) => b.date - a.date)
        setLogs(logsList)
      } else {
        setLogs([])
      }
    })
    return () => unsubscribe()
  }, [groupId])

  const filteredLogs = useMemo(() => {
    const filterKeywords: Record<FilterKey, string> = {
      todos: '',
      fiado: 'deuda',
      compra: 'compra',
      pedido: 'pedido',
    };
    const keyword = filterKeywords[activeFilter];
    const searchTermLower = searchTerm.toLowerCase();

    return logs.filter((log) => {
      const message = log.message.toLowerCase();
      const matchesSearch = !searchTermLower || message.includes(searchTermLower);
      const matchesFilter = !keyword || message.includes(keyword);
      return matchesSearch && matchesFilter;
    });
  }, [logs, searchTerm, activeFilter]);

  const filterOptions: Array<{ key: FilterKey, label: string }> = [
    { key: 'todos', label: 'Todos' },
    { key: 'fiado', label: 'Fiado' },
    { key: 'compra', label: 'Compra' },
    { key: 'pedido', label: 'Pedido' },
  ]

  return (
    <>
      <div className="search-bar-container">
        <FaSearch className="search-icon" aria-hidden="true" />
        <input
          type="text"
          placeholder="Buscar en historial..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="history-filters">
        <div className="priority-buttons">
          {filterOptions.map(({ key, label }) => (
            <button key={key} type="button" className={`priority-button ${activeFilter === key ? 'active' : ''}`} onClick={() => setActiveFilter(key)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <section className="debt-list">
        {filteredLogs.length === 0 ? (
          <p>No hay actividad registrada.</p>
        ) : (
          <ul>
            {filteredLogs.map((log) => (
              <li key={log.id} className="history-item">
                <ActionIcon action={log.action} />
                <div className="history-info">
                  <span className="history-message">
                    {/* Si el log tiene un usuario, lo mostramos en negrita */}
                    {log.userName && <strong>{log.userName}</strong>}
                    {' '}
                    {log.message}
                  </span>
                  <span className="history-date">{new Date(log.date).toLocaleString()}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

export default HistorialPage