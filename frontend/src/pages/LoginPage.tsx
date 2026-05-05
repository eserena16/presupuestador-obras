import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { HardHat, Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../api/auth'
import { useAuthStore } from '../store/useAuthStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) return
    setLoading(true)
    try {
      const res = await authApi.login(username.trim(), password)
      setTokens(res.access_token, res.refresh_token)
      setUser(res.user)
      navigate('/')
    } catch {
      triggerShake()
      toast.error('Usuario o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-app-bg">
      {/* Panel izquierdo — branding */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center items-center bg-gradient-to-br from-sky-700 via-sky-600 to-sky-800 dark:from-sky-900 dark:via-sky-800 dark:to-slate-900 p-12 relative overflow-hidden">
        <div className="absolute top-[-80px] left-[-80px] w-80 h-80 rounded-full bg-sky-500/20" />
        <div className="absolute bottom-[-60px] right-[-60px] w-64 h-64 rounded-full bg-sky-400/10" />
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/20 dark:bg-sky-500 flex items-center justify-center mx-auto mb-6 shadow-2xl backdrop-blur-sm">
            <HardHat size={44} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">ST Arquitectos</h1>
          <p className="text-sky-100 text-lg">Presupuestador de Obras</p>
          <div className="mt-10 text-left space-y-3">
            {[
              'Gestión de proyectos y presupuestos',
              'Control de versiones y autorizaciones',
              'Seguimiento de gastos reales',
              'Catálogo de precios actualizado',
            ].map((f) => (
              <div key={f} className="flex items-center gap-3 text-sky-100 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-300 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center">
              <HardHat size={22} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-app-text">ST Arquitectos</p>
              <p className="text-xs text-app-muted">Presupuestador de Obras</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-app-text">Iniciar sesión</h2>
            <p className="text-app-muted mt-1 text-sm">Ingresá con tu usuario y contraseña</p>
          </div>

          <form onSubmit={handleSubmit} className={`space-y-5 transition-transform ${shake ? 'animate-shake' : ''}`}>
            <div>
              <label className="block text-sm font-medium text-app-text2 mb-1.5">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin / tu@email.com"
                autoFocus
                className="w-full bg-app-card border border-app-line2 rounded-lg px-4 py-3 text-app-text placeholder-app-muted focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-app-text2 mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-app-card border border-app-line2 rounded-lg px-4 py-3 pr-12 text-app-text placeholder-app-muted focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-text transition-colors"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !username.trim() || !password.trim()}
              className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={18} className="animate-spin" />Ingresando...</> : 'Ingresar'}
            </button>
          </form>

          <p className="text-center text-app-faint text-xs mt-8">
            ST Arquitectos © {new Date().getFullYear()}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.4s ease; }
      `}</style>
    </div>
  )
}
