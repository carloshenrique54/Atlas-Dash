import { useEffect, useState } from "react"
import { supabase } from "../services/supabase"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCircleXmark, faSquarePlus } from "@fortawesome/free-regular-svg-icons"

import "../styles/Tarefas.css"
import Calendar from "react-calendar"

function Tarefas() {
    const [abrirCriarTarefa, setAbrirCriarTarefa] = useState(false)
    const [totalTarefas, setTotalTarefas] = useState(0)
    const [listaFuncionarios, setListaFuncionarios] = useState([])
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // Variaveis para toast de mensagem
    const [abrirToastErro, setAbrirToastErro] = useState(false)
    const [mensagemErroToast, setMensagemErroToast] = useState("")
    const [abrirToastCerto, setAbrirToastcerto] = useState(false)
    const [mensagemCertoToast, setMensagemCertoToast] = useState("")

    // Variaveis para a criação da tarefa
    const [nomeTarefa, setNomeTarefa] = useState("")
    const [descricaoTarefa, setDescricaoTarefa] = useState("")
    const [responsavelTarefa, setResponsavelTarefa] = useState("")
    const [prioridadeTarefa, setPrioridadeTarefa] = useState("alta")
    const [projetoTarefa, setProjetoTarefa] = useState(null)
    const [prazoTarefa, setPrazoTarefa] = useState("")
    const [subtarefas, setSubtarefas] = useState([])
    const [novaSubtarefa, setNovaSubtarefa] = useState("")
    const [idStartup, setIdStartup] = useState(null)
    const [idEmpresaTarefa, setIdEmpresaTarefa] = useState(null)
    const usuario = localStorage.getItem("usuario")
    let CPF = JSON.parse(usuario)
    CPF = CPF.cpf

    // Variaveis para a lista de tarefas
    const [tarefas, setTarefas] = useState([])
    const [tarefasAbertas, setTarefasAbertas] = useState({})
    const [filtro, setFiltro] = useState("todas")

    function adicionarSubtarefa() {
        if (!novaSubtarefa.trim()) return

        setSubtarefas([...subtarefas, novaSubtarefa])
        setNovaSubtarefa("")
    }

    useEffect(() => {
        async function listarFuncionarios() {
            const usuario = localStorage.getItem("usuario")
            let idEmpresa = JSON.parse(usuario)
            idEmpresa = idEmpresa.empresa_id
            const { data: listaFuncionario, erroFuncionario } = await supabase
                .from("funcionarios")
                .select("nome, cpf")
                .eq("startup_id", idEmpresa)

            if (!listaFuncionario || erroFuncionario) {
                alert("Erro: " + erroFuncionario)
            }
            else {
                console.log(listaFuncionario)
                setListaFuncionarios(listaFuncionario)
            }
        }

        listarFuncionarios()
    }, [])


    useEffect(() => {
        async function contarTarefas() {
            const { tarefasBanco, errorBanco} = await supabase
                .from("tarefas")
                .select("*", { count: "exact", head: true })
                .eq("")

            if (errorBanco) {
                alert("Erro: " + errorBanco)
            }
            else {
                setTotalTarefas(tarefasBanco)
            }
        }

        contarTarefas();
    }, [])

    console.log(totalTarefas)

    async function cadastrarTarefa(e) {
        e.preventDefault()
        if (!nomeTarefa){setMensagemErroToast("De um nome para a tarefa"); setAbrirToastErro(true); await delay(2000); setAbrirToastErro(false); return}
        if (!descricaoTarefa){setMensagemErroToast("De uma descrição para sua tarefa"); setAbrirToastErro(true); await delay(2000); setAbrirToastErro(false); return}
        if (!responsavelTarefa){setMensagemErroToast("Coloque um responsavel para tarefa"); setAbrirToastErro(true); await delay(2000); setAbrirToastErro(false); return}
        if (!prazoTarefa){setMensagemErroToast("Coloque um prazo"); setAbrirToastErro(true); await delay(2000); setAbrirToastErro(false); return}

        const {data: startup} = await supabase
            .from("startups")
            .select("id")
            .eq("dono_cpf", CPF)
            .maybeSingle()

        if (startup){
            setIdStartup(startup.id)
            setIdEmpresaTarefa(null)
        }
        else{
            const {data: empresa} = await supabase
            .from("empresas")
            .select("id")
            .eq("dono_cpf", CPF)
            .maybeSingle()

            if (empresa){
                setIdEmpresaTarefa(empresa.id)
                setIdStartup(null)
            }
        }

        const {data: tarefaCriada, errorTarefa} = await supabase
            .from("tarefas")
            .insert([
                {
                    titulo: nomeTarefa,
                    descricao: descricaoTarefa,
                    cpf_responsavel: responsavelTarefa,
                    prioridade: prioridadeTarefa,
                    projeto: projetoTarefa,
                    dia_prazo: prazoTarefa,
                    id_empresa: idEmpresaTarefa,
                    id_startup: idStartup
                }
            ])
            .select()
            .single()

            if (errorTarefa){
                alert("Erro: " + errorTarefa)
                return
            }

            const idTarefa = tarefaCriada.id

            if (subtarefas.length > 0) {
                const subtarefasFormatadas = subtarefas.map((sub) => ({
                    id_tarefa: idTarefa,
                    nome_subtarefa: sub,
                    concluida: false,
                    criado_subtarefa: new Date()
                }))

                const { error: errorSub } = await supabase
                    .from("subtarefas")
                    .insert(subtarefasFormatadas)

                if (errorSub) {
                    alert("Erro ao salvar subtarefas: " + errorSub.message)
                    return
                }
            }
    }

    const tarefasFiltradas = tarefas.filter(tarefa => {
        const total = tarefa.subtarefas.length
        const concluidas = tarefa.subtarefas.filter(s => s.concluida).length

        if (filtro === "pendentes") return concluidas === 0
        if (filtro === "em_progresso") return concluidas > 0 && concluidas < total
        if (filtro === "concluidas") return total > 0 && concluidas === total

        return true
    })
    console.log(tarefasFiltradas)

    if (!totalTarefas) {
        return (
            <>
                <div className={!abrirToastErro ? "modalAvisoTarefas" : "modalAvisoTarefas ativo"}>
                    <h3>{mensagemErroToast}</h3>
                </div>
                <div className={!abrirToastCerto ? "toast" : "toast ativo"}>
                    {mensagemCertoToast}
                </div>
                <form onSubmit={cadastrarTarefa} className={abrirCriarTarefa ? "criarTarefa" : "criarTarefa Escondido"}>
                    <div className="esquerdaTarefa">
                        <label>Nome da tarefa</label>
                        <input value={nomeTarefa} onChange={(e) => setNomeTarefa(e.target.value)} type="text" />
                        <label>Descrição</label>
                        <textarea value={descricaoTarefa} onChange={(e) => setDescricaoTarefa(e.target.value)} name="descricao" id="descricao"></textarea>
                        <div className="linhaInputTarefa">
                            <label>Responsável</label>
                            <select value={responsavelTarefa} onChange={(e) => setResponsavelTarefa(e.target.value)}>
                                <option value={""}>
                                    Selecione...
                                </option>
                                {listaFuncionarios.map((funcionario) => (
                                    <option key={funcionario.cpf} value={funcionario.cpf}>
                                        {funcionario.nome}
                                    </option>
                                ))}
                            </select>
                            <label>Prioridade</label>
                            <select value={prioridadeTarefa} onChange={(e) => setPrioridadeTarefa(e.target.value)}>
                                <option value={"alta"}>
                                    Alta
                                </option>
                                <option value={"media"}>
                                    Média
                                </option>
                                <option value={"baixa"}>
                                    Baixa
                                </option>
                            </select>
                        </div>
                        <div className="linhaInputTarefa">
                            <label>Projeto</label>
                            <select value={projetoTarefa} onChange={(e) => setProjetoTarefa(e.target.value)}>
                                <option value={""}>
                                    Nenhum
                                </option>
                            </select>
                            <div className="botoesTarefas">
                                <button>Criar Tarefa</button>
                                <button className="botaoFecharTarefas" onClick={() => setAbrirCriarTarefa(false)} type="button">Fechar</button>
                            </div>
                        </div>
                    </div>
                    <div className="direitaTarefa">
                        <label>Prazo</label>
                        <input
                            value={prazoTarefa ? prazoTarefa.toISOString().split('T')[0] : ''}
                            onChange={(e) => setPrazoTarefa(e.target.value ? new Date(e.target.value + 'T12:00:00') : null)}
                            type="date"
                            disabled
                        />
                        <Calendar
                            onChange={(date) => setPrazoTarefa(date)}
                            value={prazoTarefa || null}
                            className={"tarefaCalendario"}
                        />
                        <label>SubTarefas</label>
                        <div className="subtarefasBox">
                            <div className="inputSubtarefa">
                                <input
                                    value={novaSubtarefa}
                                    onChange={(e) => setNovaSubtarefa(e.target.value)}
                                    placeholder="Adicione uma subtarefa..."
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault()
                                            adicionarSubtarefa()
                                        }
                                    }}
                                />
                                <button className="botaoAdicionarSubtarefa" type="button" onClick={adicionarSubtarefa}><FontAwesomeIcon icon={faSquarePlus}/></button>
                            </div>

                            <ul className="listaSubtarefas">
                                {subtarefas.map((sub, index) => (
                                    <li className="subtarefa" key={index}>
                                        {sub}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSubtarefas(subtarefas.filter((_, i) => i !== index))
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faCircleXmark}/>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </form>
                <main className="semTarefas">
                    <h1>Nenhuma tarefa registrada</h1>
                    <button className={abrirCriarTarefa ? "abrirFormsTarefaBotao escondido" : "abrirFormsTarefaBotao"} onClick={() => setAbrirCriarTarefa(!abrirCriarTarefa)}>Adicionar Tarefa</button>
                </main>
            </>
        )
    }
    else {
        return (
            <main>
                <div className="filtrosTarefas">
                    <button className={filtro === "todas" ? "botaoFiltroTarefas ativo" : "botaoFiltroTarefas"} onClick={() => setFiltro("todas")}>Todas</button>
                    <button className={filtro === "pendentes" ? "botaoFiltroTarefas ativo" : "botaoFiltroTarefas"} onClick={() => setFiltro("pendentes")}>Pendentes</button>
                    <button className={filtro === "em_progresso" ? "botaoFiltroTarefas ativo" : "botaoFiltroTarefas"} onClick={() => setFiltro("em_progresso")}>Em progresso</button>
                    <button className={filtro === "concluidas" ? "botaoFiltroTarefas ativo" : "botaoFiltroTarefas"} onClick={() => setFiltro("concluidas")}>Concluídas</button>
                </div>
            </main>
        )
    }
}

export default Tarefas