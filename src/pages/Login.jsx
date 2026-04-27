import { supabase } from "../services/supabase"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "../styles/Login.css"

function Login(){
    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [senha, setSenha] = useState("")

    async function RealizarLogin(e) {
        e.preventDefault()
        
        const {data: usuarios, error} = await supabase
        .from("usuarios")
        .select("*")
        .eq("email", email)
        .eq("senha", senha)

        if(error){
            alert("Erro: " + error)
        }

        console.log(!usuarios.length === 0)
        
        if (usuarios.length === 0) {
            alert("Porra")
            return
        }

        localStorage.setItem("usuario", JSON.stringify(usuarios[0]))
        console.log(localStorage)
        navigate("/dashboard")
    }
    return(
        <main>
            <form onSubmit={RealizarLogin}>
                <h1>Login</h1>
                <div className="loginInputs">
                    <label>E-mail:</label>
                    <input onChange={e => setEmail(e.target.value)} value={email} type="email" />
                </div>
                <div className="loginInputs">
                    <label>Senha:</label>
                    <input onChange={e => setSenha(e.target.value)} value={senha} type="password" />
                </div>
                <button type="submit">Fazer Login</button>
            </form>
        </main>
    )
}

export default Login