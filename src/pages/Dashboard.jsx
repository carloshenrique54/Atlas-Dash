import { useNavigate } from "react-router-dom"
import CalendarioDash from "../components/Calendario.jsx"
import "../styles/Dashboard.css"

function Dashboard(){
    const navigate = useNavigate()
    const usuario = localStorage.getItem("usuario")
    const usuarioObj = JSON.parse(usuario)
    const usuarioNome = usuarioObj.nome

    if (!usuario){
        alert("Por favor, realize o login")
        navigate("/")
    }
    
    return(
        <main className="mainDashboard">
            <div className="topDashboard">
                <p>Bom dia, {usuarioNome} - Você tem <strong className="atraso"> 2 atrasadas </strong> e <strong className="evento"> 1 evento hoje </strong> </p>
            </div>
            <div className="midDashboard">
                <div className="cardDashboard tarefasPendentes">
                    <h2>TAREFAS PENDENTES</h2>
                    <h3>5</h3>
                    <p>2 adicionadas hoje</p> 
                </div>
                <div className="cardDashboard tarefasAtrasadas">
                    <h2>TAREFAS ATRASADAS</h2>
                    <h3>2</h3> 
                </div>
                <div className="cardDashboard tarefasConcluidas">
                    <h2>CONCLUÍDAS NA SEMANA</h2>
                    <h3>5</h3> 
                </div>
                <div className="cardDashboard tarefasProximas">
                    <h2>PRÓXIMOS PRAZOS</h2>
                    <h3>5</h3> 
                </div>
            </div>
            <div className="lowDashboard">
                <div className="lowCardDash tarefasDash">
                    <h2>Visão geral de tarefas</h2>
                </div>
                <div className="lowCardDash calendarioDash">
                    <CalendarioDash className="agendaDash" />
                </div>
                <div className="lowCardDash recenteDash">
                    <h2>Atividade Recente</h2>
                    <p>Nenhuma atividade recente</p>
                </div>
            </div>
        </main>
    )
}

export default Dashboard