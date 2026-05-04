import { supabase } from "../services/supabase"
import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import logo from "../assets/images/LogoEscura.png"
import "../styles/Login.css"

function Login() {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    const navigate = useNavigate()

    const [email, setEmail] = useState("")
    const [senha, setSenha] = useState("")  
    const [abrirToastErro, setAbrirToastErro]       = useState(false)
    const [mensagemErroToast, setMensagemErroToast]  = useState("")
    const [abrirToastCerto, setAbrirToastcerto]      = useState(false)
    const [mensagemCertoToast, setMensagemCertoToast] = useState("")

    async function RealizarLogin(e) {
        e.preventDefault()
        if (!email) { setMensagemErroToast("Insira seu email"); setAbrirToastErro(true); await delay(2000); setAbrirToastErro(false); return }
        if (!senha) { setMensagemErroToast("Insira sua senha"); setAbrirToastErro(true); await delay(2000); setAbrirToastErro(false); return }

        const { data: usuarios, error } = await supabase
            .from("usuarios")
            .select("*")
            .eq("email", email)
            .eq("senha", senha)

        if (error) { alert("Erro: " + error); return }

        if (!usuarios || usuarios.length === 0) {
            setMensagemErroToast("Usuário não encontrado")
            setAbrirToastErro(true)
            await delay(2000)
            setAbrirToastErro(false)
            return
        }

        const cpf = usuarios[0].cpf
        let empresaId = null

        const { data: usuarioEmpresa } = await supabase
            .from("empresas")
            .select("id")
            .eq("dono_cpf", cpf)
            .maybeSingle()

        if (usuarioEmpresa) {
            empresaId = usuarioEmpresa.id
        } else {
            const { data: usuarioStartup } = await supabase
                .from("startups")
                .select("id")
                .eq("dono_cpf", cpf)
                .maybeSingle()

            if (usuarioStartup) empresaId = usuarioStartup.id
        }

        const usuarioComCargo = { ...usuarios[0], cargo: "dono", empresa_id: empresaId }
        localStorage.setItem("usuario", JSON.stringify(usuarioComCargo))

        setMensagemCertoToast("Login realizado com sucesso!")
        setAbrirToastcerto(true)
        await delay(2000)
        setAbrirToastcerto(false)
        navigate("/dashboard", { replace: true })
    }

    return (
        <>
            <div className={!abrirToastErro ? "modalAviso" : "modalAviso ativo"}>
                <h3>{mensagemErroToast}</h3>
            </div>
            <div className={!abrirToastCerto ? "toast" : "toast ativo"}>
                {mensagemCertoToast}
            </div>

            <main className="mainLogin">
                <form onSubmit={RealizarLogin}>
                    <img className="logoForm" src={logo} alt="Logo" />
                    <h1>Login</h1>

                    <div className="loginInputs">
                        <label>E-mail:</label>
                        <input placeholder="exemplo@gmail.com" onChange={e => setEmail(e.target.value)} value={email} type="email" />
                    </div>

                    <div className="loginInputs">
                        <label>Senha:</label>
                        <input onChange={e => setSenha(e.target.value)} value={senha} type="password" />
                    </div>

                    <button type="submit">Fazer Login</button>

                    {/* Botão para login de funcionário */}
                    <button
                        type="button"
                        className="loginBotaoSecundario"
                        onClick={() => navigate("/loginfuncionario")}
                    >
                        Sou funcionário
                    </button>

                    <div className="links">
                        <a href="/cadastrostartup">Fazer Cadastro</a>
                        <Link to="/redefinirsenha">Esqueci minha senha</Link>
                    </div>
                </form>
            </main>
        </>
    )
}

export default Login