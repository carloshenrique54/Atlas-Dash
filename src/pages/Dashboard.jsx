import { Navigate } from "react-router-dom"
import { supabase } from "../services/supabase"
import DashboardDono from "../components/DashboardDono.jsx"
import DashboardFuncionario from "../components/DashboardFuncionario.jsx"
import "../styles/Dashboard.css"
 
function Dashboard() {
  const usuario = localStorage.getItem("usuario")
 
  if (!usuario || usuario === "undefined") {
    localStorage.removeItem("usuario")
    return <Navigate to="/" replace />
  }
 
  const usuarioObj = JSON.parse(usuario)
  const isFuncionario = usuarioObj?.cargo === "funcionario"
 
  return (
    <main className="mainDashboard">
      {isFuncionario
        ? <DashboardFuncionario usuarioObj={usuarioObj} />
        : <DashboardDono usuarioObj={usuarioObj} />
      }
    </main>
  )
}
 
export default Dashboard
 