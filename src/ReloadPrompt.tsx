import { useRegisterSW } from 'virtual:pwa-register/react'
import './ReloadPrompt.css'

function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r)
        },
        onRegisterError(error) {
            console.log('SW registration error', error)
        },
    })

    const close = () => {
        setOfflineReady(false)
        setNeedRefresh(false)
    }

    return (
        <div className="ReloadPrompt-container">
            {(offlineReady || needRefresh) && (
                <div className="ReloadPrompt-toast">
                    <div className="ReloadPrompt-message">
                        {offlineReady
                            ? <span>App lista para trabajar offline</span>
                            : <span>Nueva versión disponible, recarga para actualizar.</span>
                        }
                    </div>
                    {needRefresh && (
                        <button className="ReloadPrompt-toast-button" onClick={() => updateServiceWorker(true)}>
                            Recargar
                        </button>
                    )}
                    <button className="ReloadPrompt-toast-button" onClick={close}>
                        Cerrar
                    </button>
                </div>
            )}
        </div>
    )
}

export default ReloadPrompt
