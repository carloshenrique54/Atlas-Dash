import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faGauge, faListCheck, faCalendarDays, faFolderOpen,
  faUsers, faChartBar, faUser, faGear, faChevronLeft,
} from "@fortawesome/free-solid-svg-icons"
import "../styles/Sidebar.css"

const LINKS = [
  { to: "/dashboard",     label: "Dashboard",     icon: faGauge },
  { to: "/tarefas",       label: "Tarefas",        icon: faListCheck },
  { to: "/agenda",        label: "Agenda",          icon: faCalendarDays },
  { to: "/projetos",      label: "Projetos",        icon: faFolderOpen },
  { to: "/equipe",        label: "Equipe",          icon: faUsers },
  { to: "/relatorios",    label: "Relatórios",      icon: faChartBar },
  { to: "/perfil",        label: "Perfil",          icon: faUser },
  { to: "/configuracoes", label: "Configurações",   icon: faGear },
]

function Sidebar() {
  const [aberta, setAberta] = useState(true)
  const location = useLocation()

  return (
    <aside className={aberta ? "sidebar" : "sidebar sidebar--fechada"}>

      {/* Cabeçalho com logo e botão de toggle */}
      <div className="sidebarHeader">
        {aberta && <h2 className="sidebarLogo">Atlas</h2>}
        <button
          className={`sidebarToggle ${aberta ? "" : "sidebarToggle--virado"}`}
          onClick={() => setAberta(v => !v)}
          title={aberta ? "Recolher menu" : "Expandir menu"}
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
      </div>

      {/* Navegação */}
      <nav className="sidebarNav">
        {LINKS.map(({ to, label, icon }) => {
          const ativo = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              className={`sidebarLink ${ativo ? "sidebarLink--ativo" : ""}`}
              title={!aberta ? label : ""}
            >
              <FontAwesomeIcon icon={icon} className="sidebarLinkIcone" />
              {aberta && <span className="sidebarLinkLabel">{label}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar