import { useState } from 'react'
import { FaUsers, FaPlusCircle, FaSignInAlt, FaClipboardList, FaShoppingCart, FaBoxOpen, FaStickyNote } from 'react-icons/fa'

interface OnboardingProps {
  onComplete: () => void
}

const steps = [
  {
    icon: <FaUsers size={40} />,
    title: '¡Bienvenido a Compra y Fiado!',
    description: 'Esta app te ayuda a gestionar deudas, compras, pedidos y notas, todo dentro de un grupo privado y compartido.',
  },
  {
    icon: <FaPlusCircle size={40} />,
    title: 'Crea tu Propio Grupo',
    description: 'Puedes crear un grupo nuevo para ti y tus colaboradores. Se generará un código único de 9 dígitos para que otros puedan unirse.',
  },
  {
    icon: <FaSignInAlt size={40} />,
    title: 'Únete a un Grupo Existente',
    description: 'Si alguien ya creó un grupo, solo necesitas tu nombre y el código de 9 dígitos para unirte y empezar a colaborar.',
  },
  {
    icon: <FaClipboardList size={40} />,
    title: 'Controla el Fiado',
    description: 'Lleva un registro claro de quién te debe, qué te deben y cuánto. ¡Se acabaron las confusiones!',
  },
  {
    icon: <FaShoppingCart size={40} />,
    title: 'Lista de Compras',
    description: 'Crea una lista de compras compartida. Asigna prioridades y asegúrate de que nunca se olvide nada importante.',
  },
  {
    icon: <FaBoxOpen size={40} />,
    title: 'Gestiona Pedidos',
    description: 'Haz un seguimiento de los pedidos a proveedores, sus montos y fechas de llegada estimadas.',
  },
  {
    icon: <FaStickyNote size={40} />,
    title: 'Apunta Notas Rápidas',
    description: 'Usa las notas para apuntes rápidos, recordatorios o checklists que todo el grupo pueda ver y editar.',
  },
]

const Onboarding = ({ onComplete }: OnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(0)

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const step = steps[currentStep]

  return (
    <div className="modal-overlay onboarding-overlay">
      <div className="modal-content onboarding-content">
        <div className="onboarding-icon">{step.icon}</div>
        <h2 className="onboarding-title">{step.title}</h2>
        <p className="onboarding-description">{step.description}</p>

        <div className="onboarding-dots">
          {steps.map((_, index) => (
            <span key={index} className={`dot ${index === currentStep ? 'active' : ''}`} />
          ))}
        </div>

        <div className="onboarding-actions">
          {currentStep > 0 && (
            <button onClick={handlePrev} className="gate-button secondary">
              Anterior
            </button>
          )}
          <button onClick={handleNext} className="gate-button">
            {currentStep === steps.length - 1 ? '¡Entendido!' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Onboarding