import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/RedefinirSenha.css"
import logo from "../assets/images/LogoEscura.png"
import { supabase } from "../services/supabase";

function RedefinirSenha(){
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const [abrirToastErro, setAbrirToastErro] = useState(false)
    const [mensagemErroToast, setMensagemErroToast] = useState("")
    const [abrirToastCerto, setAbrirToastcerto] = useState(false)
    const [mensagemCertoToast, setMensagemCertoToast] = useState("")
    const [email, setEmail] = useState("")
    const [senha, setSenha] = useState("")
    const navigate = useNavigate()
    const [senhaConfirmar, setSenhaConfirmar] = useState("")

    async function enviarFormulario(e){
        e.preventDefault()
        if (!email) {setMensagemErroToast("Insira seu email"); setAbrirToastErro(true); await delay(2000); setAbrirToastErro(false); return}
        if (senha.length < 8) {setMensagemErroToast("A senha precisa de 8 caracteres"); setAbrirToastErro(true); await delay(2000); setAbrirToastErro(false); return}
        if (senhaConfirmar !== senha) {setMensagemErroToast("As senhas não coencidem"); setAbrirToastErro(true); await delay(2000); setAbrirToastErro(false); return}

        const {data: emailCorreto, error} = await supabase
            .from("usuarios")
            .select("email")
            .eq("email", email)
            .maybeSingle()

        if (!emailCorreto){
            setMensagemErroToast("Email não encontrado");
            setAbrirToastErro(true); 
            await delay(2000); 
            setAbrirToastErro(false);
            return
        }

        if (error){
            alert("Erro: " + error)
            return
        }

        const {data: senhaTroca, errorSenha} = await supabase
            .from("usuarios")
            .update({senha: senha})
            .eq('email', email)
        
        if (errorSenha){
            alert("Erro: " + errorSenha)
            return
        }
        
        console.log(senhaTroca)
        setMensagemCertoToast("Senha trocada com sucesso");
        setAbrirToastcerto(true); 
        await delay(2000); 
        setAbrirToastcerto(false);
        return
    }
    return(
        <>
            <div className={!abrirToastErro ? "modalAviso" : "modalAviso ativo"}>
                <h3>{mensagemErroToast}</h3>
            </div>
            <div className={!abrirToastCerto ? "toast" : "toast ativo"}>
                <h3>{mensagemCertoToast}</h3>
            </div>
            <main className="mainLogin">
                <form onSubmit={enviarFormulario}>
                    <img className="logoForm" src={logo} alt="logo" />
                    <h1>Redefinir Senha</h1>
                    <div className="inputBox">
                        <label>E-mail:</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="exemplo@gmail.com"></input>
                    </div>
                    <div className="inputBox">
                        <label>Nova Senha:</label>
                        <input value={senha} onChange={(e) => setSenha(e.target.value)} type="password" placeholder="Mínimo de 8 caracteres"></input>
                    </div>
                    <div className="inputBox">
                        <label>Confirmar Nova Senha:</label>
                        <input value={senhaConfirmar} onChange={(e) => setSenhaConfirmar(e.target.value)} type="password"></input>
                    </div>
                    <button className="TrocarSenha">Confirmar</button>
                    <button
                        type="button"
                        className="loginBotaoSecundario"
                        onClick={() => navigate("/")}
                    >
                        ← Voltar ao login
                    </button>
                    <div className="links">
                        <a href="https://localhost:3000/cadastrostartup">Fazer Cadastro</a>
                        <Link to="/">Realizar Login</Link>
                    </div>
                </form>
            </main>
        </>
    )
}

export default RedefinirSenha;