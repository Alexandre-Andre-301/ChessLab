import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Login } from './page/public/login/Login'
import { Cadastro } from './page/public/cadastro/Cadastro'
import { AppLayout } from './components/layout/AppLayout'
import { Home } from './page/private/home/Home'
import { Perfil } from './page/private/perfil/Perfil'
import { Partidas } from './page/private/partidas/Partidas'
import { PartidaDetalhe } from './page/private/partidas/PartidaDetalhe'
import { Insights } from './page/private/insights/Insights'
import { TreinoAberturas } from './page/private/treino/TreinoAberturas'
import { Puzzles } from './page/private/puzzles/Puzzles'
import { Configuracoes } from './page/private/configuracoes/Configuracoes'
import { Onboarding } from './page/private/onboarding/Onboarding'
import { ProtectedRoute } from './components/routing/Guards'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="partidas" element={<Partidas />} />
          <Route path="partidas/:gameId" element={<PartidaDetalhe />} />
          <Route path="insights" element={<Insights />} />
          <Route path="treino-aberturas" element={<TreinoAberturas />} />
          <Route path="puzzles" element={<Puzzles />} />
          <Route path="perfil" element={<Perfil />} />
          <Route path="configuracoes" element={<Configuracoes />} />
        </Route>
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
