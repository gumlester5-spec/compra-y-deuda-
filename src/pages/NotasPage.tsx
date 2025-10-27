import { useState, useEffect, useRef } from 'react'
import { useGroup } from '../context/GroupContext'
import DOMPurify from 'dompurify'
import { db } from '../db'
import { ref, onValue, set, push, remove } from 'firebase/database'
import { toast, type Toast } from 'react-hot-toast'
import { FaPlus, FaTimes, FaTrash, FaBold, FaItalic, FaListUl, FaListOl, FaCheckSquare } from 'react-icons/fa'

interface Note {
  id: string
  // El contenido ahora puede ser HTML
  content: string 
  date: number
}

const NotasPage = () => {
  const [notes, setNotes] = useState<Note[]>([])
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set())
  const { groupId } = useGroup()
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!groupId) return

    const notesRef = ref(db, `groups/${groupId}/notes`)
    const unsubscribe = onValue(notesRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const notesList: Note[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
        }))
        notesList.sort((a, b) => b.date - a.date)
        setNotes(notesList)
      } else {
        setNotes([])
      }
    })

    return () => unsubscribe()
  }, [groupId])

  // Efecto para actualizar el estado de la barra de herramientas
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const handleSelectionChange = () => {
      const newActiveFormats = new Set<string>()
      if (document.queryCommandState('bold')) newActiveFormats.add('bold')
      if (document.queryCommandState('italic')) newActiveFormats.add('italic')
      if (document.queryCommandState('insertUnorderedList')) newActiveFormats.add('insertUnorderedList')
      if (document.queryCommandState('insertOrderedList')) newActiveFormats.add('insertOrderedList')

      // Custom logic for checklist active state
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        let currentNode: Node | null = range.commonAncestorContainer
        while (currentNode && currentNode !== editor) {
          if (currentNode.nodeName === 'LI' && (currentNode as HTMLElement).querySelector('input[type="checkbox"]')) {
            newActiveFormats.add('insertChecklist')
            break
          }
          currentNode = currentNode.parentNode
        }
      }
      setActiveFormats(newActiveFormats)
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [isFormVisible])

  // Efecto para manejar el tachado de texto en los checklists
  useEffect(() => {
    const editor = editorRef.current
    if (!isFormVisible || !editor) return

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.nodeName === 'INPUT' && target.getAttribute('type') === 'checkbox') {
        const checkbox = target as HTMLInputElement
        const listItem = checkbox.closest('li')
        if (listItem) {
          // Usamos una clase para controlar el estilo
          listItem.classList.toggle('checked', checkbox.checked)
        }
      }
    }

    editor.addEventListener('click', handleClick)

    // Limpiamos el listener cuando el componente se desmonta o el modal se cierra
    return () => editor.removeEventListener('click', handleClick)
  }, [isFormVisible])

  // Efecto para cargar el contenido en el editor cuando se abre
  useEffect(() => {
    if (isFormVisible && editorRef.current) {
      const noteToEdit = editingNoteId ? notes.find(n => n.id === editingNoteId) : null
      editorRef.current.innerHTML = noteToEdit ? noteToEdit.content : ''
      editorRef.current.focus() // Opcional: enfocar el editor al abrir
    }
  }, [isFormVisible, editingNoteId, notes])

  const handleOpenForm = (note: Note | null = null) => {
    if (note) {
      setEditingNoteId(note.id)
    } else {
      setEditingNoteId(null)
    }
    setIsFormVisible(true)
  }

  const handleCloseForm = () => {
    setIsFormVisible(false)
    setEditingNoteId(null)
  }

  const handleSaveNote = async () => {
    // Sanitizamos el HTML antes de guardarlo para prevenir ataques XSS.
    const contentToSave = DOMPurify.sanitize(editorRef.current?.innerHTML || '')
    if (!groupId) return toast.error('Debes estar en un grupo para guardar notas.')
    if (!contentToSave.trim()) return toast.error('La nota no puede estar vacía.')

    try {
      if (editingNoteId) {
        // Actualizar nota existente
        const noteRef = ref(db, `groups/${groupId}/notes/${editingNoteId}`)
        await set(noteRef, {
          content: contentToSave,
          date: Date.now(),
        })
        toast.success('Nota actualizada.')
      } else {
        // Crear nueva nota
        const notesRef = ref(db, `groups/${groupId}/notes`)
        await push(notesRef, {
          content: contentToSave,
          date: Date.now(),
        })
        toast.success('Nota guardada.')
      }
      handleCloseForm()
    } catch (error) {
      toast.error('Error al guardar la nota.')
      console.error('Error saving note:', error)
    }
  }

  const handleDeleteNote = async () => {
    if (!groupId || !editingNoteId) return

    const deleteAction = async () => {
      const noteRef = ref(db, `groups/${groupId}/notes/${editingNoteId}`)
      await remove(noteRef)
      toast.success('Nota eliminada.')
      handleCloseForm()
    }

    toast(
      (t: Toast) => (
        <div className="toast-container">
          <b>¿Eliminar esta nota?</b>
          <div className="toast-buttons">
            <button className="toast-button confirm delete" onClick={() => { deleteAction(); toast.dismiss(t.id) }}>Eliminar</button>
            <button className="toast-button cancel" onClick={() => toast.dismiss(t.id)}>No</button>
          </div>
        </div>
      ),
      { duration: 6000 }
    )
  }

  const transformToChecklist = () => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const container = range.commonAncestorContainer

    // Encuentra el <li> o el <ul>/ol> más cercano
    let listElement: Node | null = container
    while (listElement && !['LI', 'UL', 'OL'].includes(listElement.nodeName) && listElement !== editorRef.current) {
      listElement = listElement.parentNode
    }

    if (listElement && (listElement.nodeName === 'UL' || listElement.nodeName === 'OL')) {
      // Si estamos en una lista, convierte todos sus hijos a checklist
      const items = listElement.childNodes
      items.forEach(item => {
        if (item.nodeName === 'LI' && !(item as HTMLElement).querySelector('input[type="checkbox"]')) {
          (item as HTMLElement).innerHTML = `<input type="checkbox" />&nbsp;${(item as HTMLElement).innerHTML}`
        }
      })
    } else {
      // Si no, simplemente ejecuta el comando de lista desordenada
      // y el primer elemento se convertirá en un checklist item
      document.execCommand('insertUnorderedList', false)
      // La lógica para convertir el primer 'li' se añade a handleFormat
    }
  }

  const handleFormat = (command: string) => {
    if (editorRef.current) {
      editorRef.current.focus()
      if (command === 'insertChecklist') {
        transformToChecklist()
      } else {
        document.execCommand(command, false)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && editorRef.current) {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      let currentNode: Node | null = range.startContainer;

      // Sube en el DOM para encontrar el <li> padre
      while (currentNode && currentNode.nodeName !== 'LI' && currentNode !== editorRef.current && currentNode.parentNode) {
        currentNode = currentNode.parentNode;
      }

      if (currentNode && currentNode.nodeName === 'LI' && (currentNode as HTMLElement).querySelector('input[type="checkbox"]')) {
        e.preventDefault() // Prevenimos el comportamiento por defecto de "Enter"
        
        // Creamos un nuevo elemento de lista con un checkbox
        const newLi = document.createElement('li');
        newLi.innerHTML = '<input type="checkbox">&nbsp;';

        // Insertamos el nuevo <li> después del actual y movemos el cursor
        const parent = (currentNode as HTMLElement).parentNode;
        if (parent) {
          if ((currentNode as HTMLElement).nextSibling) {
            parent.insertBefore(newLi, (currentNode as HTMLElement).nextSibling);
          } else {
            parent.appendChild(newLi);
          }
          // Coloca el cursor al final del nuevo elemento de lista
          const newRange = document.createRange();
          newRange.setStart(newLi, 1); // Después del checkbox y el espacio
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
    }
  }

  return (
    <div className="notas-page">
      {isFormVisible ? (
        <div className="nota-editor-page">
          <div className="nota-editor-header">
            <h2>{editingNoteId ? 'Editar Nota' : 'Nueva Nota'}</h2>
            <button onClick={handleCloseForm} className="close-button"><FaTimes /></button>
          </div>
          <div className="editor-toolbar" onMouseDown={(e) => e.preventDefault()}> {/* Prevent editor losing focus */}
            <button type="button" onClick={() => handleFormat('bold')} className={activeFormats.has('bold') ? 'active' : ''}><FaBold /></button>
            <button type="button" onClick={() => handleFormat('italic')} className={activeFormats.has('italic') ? 'active' : ''}><FaItalic /></button>
            <button type="button" onClick={() => handleFormat('insertUnorderedList')} className={activeFormats.has('insertUnorderedList') ? 'active' : ''}><FaListUl /></button>
            <button type="button" onClick={() => handleFormat('insertOrderedList')} className={activeFormats.has('insertOrderedList') ? 'active' : ''}><FaListOl /></button>
            <button type="button" onClick={() => handleFormat('insertChecklist')} className={activeFormats.has('insertChecklist') ? 'active' : ''}><FaCheckSquare /></button>
          </div>
          <div
            ref={editorRef}
            className="notas-editor-area"
            contentEditable
            onKeyDown={handleKeyDown} // Añadimos el manejador para la tecla Enter
            translate="no"
            // Eliminamos dangerouslySetInnerHTML y los eventos onInput/onKeyUp para evitar re-renderizados
          />
          <div className="nota-editor-actions">
            {editingNoteId && <button onClick={handleDeleteNote} className="cancel-button delete"><FaTrash /> Eliminar</button>}
            <div style={{ flex: 1 }}></div> {/* Espaciador */}
            <button onClick={handleCloseForm} className="cancel-button">Cancelar</button>
            <button onClick={handleSaveNote} className="save-button">Guardar</button>
          </div>
        </div>
      ) : (
        <>
          <div className="notes-grid">
            {notes.length === 0 ? <p>No hay notas. ¡Añade la primera!</p> : notes.map(note => (
              <div key={note.id} className="note-card" onClick={() => handleOpenForm(note)}>
                {/* Aunque sanitizamos al guardar, es una buena práctica hacerlo también al renderizar como doble capa de seguridad. */}
                <div className="note-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note.content) }} translate="no" />
                <small>{new Date(note.date).toLocaleDateString()}</small>
              </div>
            ))}
          </div>
          <button onClick={() => handleOpenForm(null)} className="fab-secondary" aria-label="Agregar nota">
            <FaPlus />
          </button>
        </>
      )}
    </div>
  )
}

export default NotasPage