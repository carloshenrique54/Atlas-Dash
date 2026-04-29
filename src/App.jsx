// Bibliotecas
import { Routes, Route, useLocation } from 'react-router-dom'

// Components
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'

// Pages
import Login from "./pages/Login.jsx"
import Dashboard from './pages/Dashboard.jsx'
import Tarefas from "./pages/Tarefas.jsx"
import Agenda from './pages/Agenda.jsx'
import RedefinirSenha from './pages/RedefinirSenha.jsx'
import Projetos from './pages/Projetos.jsx'
import Equipe from './pages/Equipe.jsx'
import Relatorios from './pages/Relatorios.jsx'
import Perfil from './pages/Perfil.jsx'
import Configuracoes from './pages/Configuracoes.jsx'
import LoginFuncionario from './pages/LoginFuncionario.jsx'

// Arquivos .CSS
import './styles/App.css'

function App() { 
  const location = useLocation()

  const mostrarComponentes =
    location.pathname !== "/" &&
    location.pathname !== "/redefinirsenha" &&
    location.pathname !== "/loginfuncionario"
  
  return (
    <>
      {mostrarComponentes && <Sidebar />}

      <div className='telas'>
        {mostrarComponentes && <Header />}
        <Routes>
          <Route path="/" element={<Login />}/>
          <Route path="/dashboard" element={<Dashboard />}/>
          <Route path="/tarefas" element={<Tarefas />}/>
          <Route path="/agenda" element={<Agenda />}/>
          <Route path='/projetos' element={<Projetos />}/>
          <Route path='/equipe' element={<Equipe />}/>
          <Route path='/relatorios' element={<Relatorios />}/>
          <Route path='/perfil' element={<Perfil />}/>
          <Route path='/configuracoes' element={<Configuracoes />}/>
          <Route path='/loginfuncionario' element={<LoginFuncionario />}/>
          <Route path='/redefinirsenha' element={<RedefinirSenha />}/>
        </Routes>
      </div>
    </>
  )
}

export default App
