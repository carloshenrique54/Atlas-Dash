import CalendarioAgenda from "../components/CalendarioAgenda.jsx"
import "../styles/Agenda.css"

function Agenda(){
    return(
        <main className="mainAgenda">
            <div className="calendarioEsquerda">
                <CalendarioAgenda />
            </div>
            <div className="calendarioDireito">
                <h2>Nenhum evento</h2>
            </div>
        </main>
    )
}

export default Agenda