import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  LayoutDashboard,
  LogOut,
  Puzzle,
  Search,
  Settings,
  Swords,
  User,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/ThemeToggle'
import { useAuthStore } from '@/store/authStore'

const NAV_SECTIONS = [
  {
    label: 'Jogo',
    items: [
      { to: '/', label: 'Início', icon: LayoutDashboard },
      { to: '/partidas', label: 'Partidas', icon: Swords },
      { to: '/insights', label: 'Insights', icon: Search },
    ],
  },
  {
    label: 'Treino',
    items: [
      { to: '/treino-aberturas', label: 'Aberturas', icon: BookOpen },
      { to: '/puzzles', label: 'Puzzles', icon: Puzzle },
    ],
  },
  {
    label: 'Conta',
    items: [
      { to: '/perfil', label: 'Perfil', icon: User },
      { to: '/configuracoes', label: 'Configurações', icon: Settings },
    ],
  },
]

export const AppLayout = () => {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                render={<NavLink to="/" className="flex w-full items-center gap-2" />}
              >
                {/* substitui pelo teu logótipo */}
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-primary/10 text-sm font-bold text-primary">
                  ♟
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-bold text-foreground">ChessLab</span>
                  <span className="text-[10px] text-muted-foreground">
                    analisa · treina · ganha
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          {NAV_SECTIONS.map((section) => (
            <SidebarGroup key={section.label}>
              <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map(({ to, label, icon: Icon }) => {
                    const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to)
                    return (
                      <SidebarMenuItem key={to}>
                        <SidebarMenuButton
                          isActive={isActive}
                          tooltip={label}
                          render={
                            <NavLink to={to} end={to === '/'} className="flex w-full items-center gap-2">
                              <Icon />
                              <span>{label}</span>
                            </NavLink>
                          }
                        />
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            {user && (
              <SidebarMenuItem>
                <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
                  <Avatar className="size-7">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                      {user.full_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-col leading-tight">
                    <span className="truncate text-[13px] font-semibold text-foreground">
                      {user.full_name.split(' ')[0]}
                    </span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </div>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} tooltip="Sair" className="text-destructive hover:text-destructive">
                <LogOut />
                <span>Sair</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-20 flex h-12 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm font-semibold text-foreground">ChessLab</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
