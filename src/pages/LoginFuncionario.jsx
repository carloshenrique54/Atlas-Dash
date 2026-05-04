import { supabase } from "../services/supabase"
import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import logo from "../assets/images/LogoEscura.png"
import "../styles/Login.css"

function LoginFuncionario() {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    const navigate = useNavigate()

    const [email, setEmail]                 = useState("")
    const [senha, setSenha]                 = useState("")
    const [codigoEmpresa, setCodigoEmpresa] = useState("")
    const usuario = localStorage.getItem("usuario")

    const [abrirToastErro, setAbrirToastErro]        = useState(false)
    const [mensagemErroToast, setMensagemErroToast]   = useState("")
    const [abrirToastCerto, setAbrirToastcerto]       = useState(false)
    const [mensagemCertoToast, setMensagemCertoToast] = useState("")

    if (usuario) navigate("/dashboard")

    async function mostrarErro(msg) {
        setMensagemErroToast(msg)
        setAbrirToastErro(true)
        await delay(2000)
        setAbrirToastErro(false)
    }

    async function RealizarLogin(e) {
        e.preventDefault()

        if (!email)          return mostrarErro("Insira seu email")
        if (!senha)          return mostrarErro("Insira sua senha")
        if (!codigoEmpresa)  return mostrarErro("Insira o código da sua empresa")

        // 1. Buscar funcionário
        const { data: funcionarios, error } = await supabase
            .from("funcionarios")
            .select("*")
            .eq("email", email)
            .eq("senha", senha)

        if (error || !funcionarios || funcionarios.length === 0)
            return mostrarErro("Usuário não encontrado")

        const funcionario = funcionarios[0]

        // 2. Descobrir empresa pelo código
        let empresaId = null

        const { data: empresa } = await supabase
            .from("empresas")
            .select("id")
            .eq("codigoconvite", codigoEmpresa)
            .maybeSingle()

        if (empresa) {
            empresaId = empresa.id
        } else {
            const { data: startup } = await supabase
                .from("startups")
                .select("id")
                .eq("codigoconvite", codigoEmpresa)
                .maybeSingle()

            if (!startup) return mostrarErro("Código inválido")
            empresaId = startup.id
        }

        // 3. Verificar vínculo
        const { data: vinculo } = await supabase
            .from("funcionarios")
            .select("id")
            .eq("cpf", funcionario.cpf)
            .or(`empresa_id.eq.${empresaId},startup_id.eq.${empresaId}`)
            .maybeSingle()

        if (!vinculo) return mostrarErro("Você não pertence a essa empresa")

        // 4. Salvar e redirecionar
        const usuarioFinal = { ...funcionario, cargo: "funcionario", empresa_id: empresaId }
        localStorage.setItem("usuario", JSON.stringify(usuarioFinal))

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
                        <label>Código da empresa:</label>
                        <input
                            placeholder="Ex: TNOV-2024"
                            onChange={e => setCodigoEmpresa(e.target.value)}
                            value={codigoEmpresa}
                            type="text"
                        />
                    </div>

                    <div className="loginInputs">
                        <label>E-mail:</label>
                        <input placeholder="exemplo@gmail.com" onChange={e => setEmail(e.target.value)} value={email} type="email" />
                    </div>

                    <div className="loginInputs">
                        <label>Senha:</label>
                        <input onChange={e => setSenha(e.target.value)} value={senha} type="password" />
                    </div>

                    <button className="loginFuncionarioBotao" type="submit">Entrar como Funcionário</button>

                    {/* Botão para voltar ao login de dono */}
                    <button
                        type="button"
                        className="loginBotaoSecundario"
                        onClick={() => navigate("/")}
                    >
                        ← Voltar ao login
                    </button>

                    <div className="links">
                        <Link to="/cadastrofuncionario">Fazer Cadastro</Link>
                        <Link to="/redefinirsenha">Esqueci minha senha</Link>
                    </div>
                </form>
            </main>
        </>
    )
}

export default LoginFuncionario