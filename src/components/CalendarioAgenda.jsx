import Calendar from "react-calendar"
import { useState } from "react"

function CalendarioAgenda() {
    const [data, setData] = useState(new Date())

    return (
        <div className="calendarioContainer">
            <Calendar 
                onChange={setData} 
                value={data}
                className={"Agenda"}
            />

            <div className="eventoInfo">
                <span className="barra"></span>
                <div>
                </div>
            </div>
        </div>
    )
}

export default CalendarioAgenda