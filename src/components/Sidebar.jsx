import { useState } from "react"
import "../styles/Sidebar.css"
import { Link } from "react-router-dom"

function Sidebar(){
    const [abrirSidebar, setAbrirSidebar] = useState(true)
    const [pagina, setPagina] = useState("dashboard")

    function FecharSidebar(){
        console.log(abrirSidebar)
        if (abrirSidebar){
            setAbrirSidebar(false)
        }
        else{
            setAbrirSidebar(true)
        }
    }

    return(
        <aside className={abrirSidebar ? "sidebar" : "sidebar fechada"}>
            <h2>Atlas</h2>
            <nav>
                <Link to={"/dashboard"} className={pagina === "dashboard" && "ativo"} onClick={() => setPagina("dashboard")}>Dashboard</Link>
                <Link to={"/tarefas"} className={pagina === "tarefas" && "ativo"} onClick={() => setPagina("tarefas")}>Tarefas</Link>
                <Link to={"/agenda"} className={pagina === "agenda" && "ativo"} onClick={() => setPagina("agenda")}>Agenda</Link>
                <Link className={pagina === "projetos" && "ativo"} onClick={() => setPagina("projetos")}>Projetos</Link>
                <Link className={pagina === "equipe" && "ativo"} onClick={() => setPagina("equipe")}>Equipe</Link>
                <Link className={pagina === "relatorios" && "ativo"} onClick={() => setPagina("relatorios")}>Relatórios</Link>
                <Link className={pagina === "perfil" && "ativo"} onClick={() => setPagina("perfil")}>Perfil</Link>
                <Link className={pagina === "configurações" && "ativo"} onClick={() => setPagina("configurações")}>Configurações</Link>
            </nav>
            <button onClick={FecharSidebar} >Fechar</button>
        </aside>
    )
}

export default Sidebar