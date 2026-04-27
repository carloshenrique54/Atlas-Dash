import { useState } from "react";
import "../styles/RedefinirSenha.css"

function RedefinirSenha(){
    const [abrirToastErro, setAbrirToastErro] = useState("")
    const [mensagemErroToast, setMensagemErroToast] = useState("Cé é burro?")
    const [abrirToastCerto, setAbrirToastcerto] = useState("")
    const [mensagemCertoToast, setMensagemCertoToast] = useState("")
    return(
        <>
            <div className={!abrirToastErro ? "modalAviso" : "modalAviso ativo"}>
                <h3>{mensagemErroToast}</h3>
            </div>
            <div className={!abrirToastCerto ? "toast" : "toast ativo"}>
                {mensagemCertoToast}
            </div>
            <main className="mainLogin">
                <form>
                    <div className="inputBox">
                        <label>E-mail:</label>
                        <input></input>
                    </div>
                    <div className="inputBox">
                        <label>Nova Senha:</label>
                        <input></input>
                    </div>
                    <div className="inputBox">
                        <label>Confirmar Nova Senha:</label>
                        <input></input>
                    </div>
                    <button className="TrocarSenha">Confirmar</button>
                </form>
            </main>
        </>
    )
}

export default RedefinirSenha;