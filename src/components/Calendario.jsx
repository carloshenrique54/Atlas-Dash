import Calendar from "react-calendar"
import "react-calendar/dist/Calendar.css"
import { useState } from "react"

function CalendarioDash() {
    const [data, setData] = useState(new Date())

    return (
        <div className="calendarioContainerDash">
            <Calendar 
                onChange={setData} 
                value={data}
                className={"agendaDash"}
            />

            <div className="eventoInfo">
                <span className="barra"></span>
                <div>
                </div>
            </div>
        </div>
    )
}

export default CalendarioDash