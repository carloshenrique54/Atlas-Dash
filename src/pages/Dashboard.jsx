import { useNavigate } from "react-router-dom"

function Dashboard(){
    const navigate = useNavigate()
    const usuario = localStorage.getItem("usuario")

    if (!usuario){
        alert("Porra")
        navigate("/")
    }
    
    return(
        <div>
            oloco
        </div>
    )
}

export default Dashboard