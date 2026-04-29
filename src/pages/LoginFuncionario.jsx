import { supabase } from "../services/supabase"
import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import logo from "../assets/images/LogoEscura.png"
import "../styles/Login.css"

function LoginFuncionario(){
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [senha, setSenha] = useState("")
    const [codigoEmpresa, setCodigoEmpresa] = useState("")
    const usuario = localStorage.getItem("usuario")
    const [abrirToastErro, setAbrirToastErro] = useState(false)
    const [mensagemErroToast, setMensagemErroToast] = useState("")
    const [abrirToastCerto, setAbrirToastcerto] = useState(false)
    const [mensagemCertoToast, setMensagemCertoToast] = useState("")

    if (usuario){
        navigate("/dashboard")
    }

    async function RealizarLogin(e){
    e.preventDefault()

    if (!email){
        setMensagemErroToast("Insira seu email")
        setAbrirToastErro(true)
        await delay(2000)
        setAbrirToastErro(false)
        return
    }

    if (!senha){
        setMensagemErroToast("Insira sua senha")
        setAbrirToastErro(true)
        await delay(2000)
        setAbrirToastErro(false)
        return
    }

    if (!codigoEmpresa){
        setMensagemErroToast("Insira o código da sua empresa")
        setAbrirToastErro(true)
        await delay(2000)
        setAbrirToastErro(false)
        return
    }

    // 1. Buscar usuário
    const { data: usuarios, error } = await supabase
        .from("funcionarios")
        .select("*")
        .eq("email", email)
        .eq("senha", senha)

    if (error || !usuarios || usuarios.length === 0){
        setMensagemErroToast("Usuário não encontrado")
        setAbrirToastErro(true)
        await delay(2000)
        setAbrirToastErro(false)
        return
    }

    const usuario = usuarios[0]

    // 2. Descobrir empresaId 
    let empresaId = null

    const { data: empresa } = await supabase
        .from("empresas")
        .select("id")
        .eq("codigoconvite", codigoEmpresa)
        .maybeSingle()

    if (empresa){
        empresaId = empresa.id
    } else {
        const { data: startup } = await supabase
            .from("startups")
            .select("id")
            .eq("codigoconvite", codigoEmpresa)
            .maybeSingle()

        if (!startup){
            setMensagemErroToast("Código inválido")
            setAbrirToastErro(true)
            await delay(2000)
            setAbrirToastErro(false)
            return
        }

        empresaId = startup.id
    }

    // 3. Verificar vínculo
    const { data: funcionario } = await supabase
        .from("funcionarios")
        .select("*")
        .eq("cpf", usuario.cpf)
        .eq("empresa_id", empresaId)
        .maybeSingle()

    if (!funcionario){
        const {data: funcionarioStartup} = await supabase
        .from("funcionarios")
        .select("*")
        .eq("cpf", usuario.cpf)
        .eq("startup_id", empresaId)
        .maybeSingle()

        if (!funcionarioStartup){
            setMensagemErroToast("Você não pertence a essa empresa")
            setAbrirToastErro(true)
            await delay(2000)
            setAbrirToastErro(false)
            return
        }
    }

    // 4. Montar usuário final
    const usuarioFinal = {
        ...usuario,
        cargo: "funcionario",
        empresa_id: empresaId
    }

    localStorage.setItem("usuario", JSON.stringify(usuarioFinal))

    setMensagemCertoToast("Login realizado com sucesso!")
    setAbrirToastcerto(true)

    await delay(2000)
    setAbrirToastcerto(false)

    navigate("/dashboard", { replace: true })
}
    return(
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
                <h1>Login Funcionario</h1>
                <div className="loginInputs">
                    <label>Código da empresa:</label>
                    <input maxLength={5} placeholder="Ex: 58640" onChange={e => setCodigoEmpresa(e.target.value)} value={codigoEmpresa} type="text" />
                </div>
                <div className="loginInputs">
                    <label>E-mail:</label>
                    <input placeholder="exemplo@gmail.com" onChange={e => setEmail(e.target.value)} value={email} type="email" />
                </div>
                <div className="loginInputs">
                    <label>Senha:</label>
                    <input onChange={e => setSenha(e.target.value)} value={senha} type="password" />
                </div>
                <button type="submit">Fazer Login</button>
                <div className="links">
                    <Link to={"https://localhost:3000/cadastrofuncionario"} repla>Fazer Cadastro</Link>
                    <Link to="/redefinirsenha">Esqueci minha senha</Link>
                </div>
            </form>
        </main>
        </>
    )
}

export default LoginFuncionario