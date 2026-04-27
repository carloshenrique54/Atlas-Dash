// Bibliotecas
import { Routes, Route, BrowserRouter } from 'react-router-dom'

// Components
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'

// Pages

import Login from "./pages/Login.jsx"
import Dashboard from './pages/Dashboard.jsx'
import Tarefas from "./pages/Tarefas.jsx"
import Agenda from './pages/Agenda.jsx'
import RedefinirSenha from './pages/RedefinirSenha.jsx'

// Arquivos .CSS
import './styles/App.css'

function App() {
  return (
    <BrowserRouter>
    
    {location.pathname !== "/" ? location.pathname !== "/redefinirsenha" ? <Sidebar/> : null : null}

    <div className='telas'>
      {location.pathname !== "/" ? location.pathname !== "/redefinirsenha" ? <Header /> : null : null}
      <Routes>
        <Route path="/" element={<Login />}/>
        <Route path="/dashboard" element={<Dashboard />}/>
        <Route path="/tarefas" element={<Tarefas />}/>
        <Route path="/agenda" element={<Agenda />}/>
        <Route path='/redefinirsenha' element={<RedefinirSenha />}/>
      </Routes>
    </div>
    </BrowserRouter>
  )
}

export default App
