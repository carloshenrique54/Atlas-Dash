// Bibliotecas
import { Routes, Route, BrowserRouter } from 'react-router-dom'

// Components

// Pages

import Login from "./pages/Login.jsx"

// Arquivos .CSS
import './styles/App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login  />}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
