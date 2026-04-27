import "../styles/Header.css"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBell } from "@fortawesome/free-regular-svg-icons"

function Header(){
    return(
        <header>
            <div className="comecoHeader">
                <h2>DashBoard</h2>
                <h3>Sexta - Feira, 27 de abril de 2026</h3>
            </div>
            <div className="finalHeader">
                <input placeholder="Pesquisar"/>
                <FontAwesomeIcon className="notificacao" icon={faBell} />
            </div>
        </header>
    )
}

export default Header