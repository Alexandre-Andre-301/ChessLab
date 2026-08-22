import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BookOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Puzzle,
  Settings,
  User,
  X,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import './AppLayout.css'

const NAV_ITEMS = [
  { to: '/', label: 'Início', icon: LayoutDashboard },
  { to: '/perfil', label: 'Perfil', icon: User },
  { to: '/treino-aberturas', label: 'Treino de Aberturas', icon: BookOpen },
  { to: '/puzzles', label: 'Puzzles', icon: Puzzle },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
]

const SidebarNav = ({ onNavigate }: { onNavigate?: () => void }) => {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="sidebar-inner">
      {/* substitui este bloco pelo teu logótipo */}
      <div className="sidebar-brand">
        <div className="sidebar-logo" aria-hidden="true" />
        <span className="sidebar-wordmark">ChessLab</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            onClick={onNavigate}
          >
            <Icon size={19} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {user && (
          <div className="sidebar-user">
            <span className="avatar">{user.full_name.charAt(0).toUpperCase()}</span>
            <span className="sidebar-username">{user.full_name.split(' ')[0]}</span>
          </div>
        )}
        <button className="nav-item nav-logout" onClick={handleLogout}>
          <LogOut size={19} strokeWidth={1.8} />
          <span>Sair</span>
        </button>
      </div>
    </div>
  )
}

export const AppLayout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <SidebarNav />
      </aside>

      <header className="mobile-topbar">
        <button
          className="hamburger"
          onClick={() => setDrawerOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>
        <span className="mobile-brand">ChessLab</span>
        <span className="mobile-spacer" />
      </header>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="drawer-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              className="drawer-sidebar"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'tween', duration: 0.25 }}
            >
              <button
                className="drawer-close"
                onClick={() => setDrawerOpen(false)}
                aria-label="Fechar menu"
              >
                <X size={20} />
              </button>
              <SidebarNav onNavigate={() => setDrawerOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <motion.main
        className="app-content"
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
      >
        <Outlet />
      </motion.main>
    </div>
  )
}
