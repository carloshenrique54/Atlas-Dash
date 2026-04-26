import { supabase } from "../services/supabase"
import { useState } from "react"
import "../styles/Login.css"

function Login(){
    const [email, setEmail] = useState("")
    const [senha, setSenha] = useState("")

    async function RealizarLogin(e) {
        e.preventDefault()
        
        const {data: resposta, error} = await supabase
        .from("usuarios")
        .select("email", "senha")
        .eq("email", email)
        .eq("senha", senha)

        if(error){
            alert("Erro: " + error)
        }

        console.log(resposta)
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