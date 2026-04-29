import "../styles/Header.css"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBell } from "@fortawesome/free-regular-svg-icons"

function Header(){
    const tela = location.pathname
    let tituloHeader
    const data = new Date();

    const dia = String(data.getDate())
    const ano = data.getFullYear()

    const mes = String(data.getMonth())
    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
    const nomeMeses = meses[mes]

    const diaSemana = data.getDay(); 
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const nomeDia = dias[diaSemana];

    switch(tela){
        default:
            null
            break
        case ("/dashboard"):
            tituloHeader = "DashBoard"
            break
        case ("/agenda"):
            tituloHeader = "Agenda"
            break
        case ("/equipe"):
            tituloHeader = "Equipe"
            break
        case ("/tarefas"):
            tituloHeader = "Tarefas"
            break
        case ("/projetos"):
            tituloHeader = "Projetos"
            break
        case ("/relatorios"):
            tituloHeader = "Relatórios"
            break
        case ("/perfil"):
            tituloHeader = "Perfil"
            break
        case ("/configuracoes"):
            tituloHeader = "Configurações"
            break
    }

    return(
        <header>
            <div className="comecoHeader">
                <h2>{tituloHeader}</h2>
                <h3>{nomeDia}, {dia} de {nomeMeses} de {ano}</h3>
            </div>
            <div className="finalHeader">
                <input placeholder="Pesquisar"/>
                <FontAwesomeIcon className="notificacao" icon={faBell} />
            </div>
        </header>
    )
}

export default Header