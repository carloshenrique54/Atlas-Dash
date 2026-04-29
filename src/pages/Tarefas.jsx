import { useEffect, useState } from "react"
import { supabase } from "../services/supabase"

import "../styles/Tarefas.css"
import Calendar from "react-calendar"

function Tarefas(){
    const [abrirCriarTarefa, setAbrirCriarTarefa] = useState(false)
    const [totalTarefas, setTotalTarefas] = useState(0)
    const [listaFuncionarios, setListaFuncionarios] = useState([])

    // Variaveis para a criação da tarefa
    const [nomeTarefa, setNomeTarefa] = useState("")
    const [descricaoTarefa, setDescricaoTarefa] = useState("")
    const [responsavelTarefa, setResponsavelTarefa] = useState("")
    const [prioridadeTarefa, setPrioridadeTarefa] = useState("")
    const [projetoTarefa, setProjetoTarefa] = useState("")
    const [prazoTarefa, setPrazoTarefa] = useState("")

    useEffect(() => {
        async function listarFuncionarios(){
            const usuario = localStorage.getItem("usuario")
            let idEmpresa = JSON.parse(usuario)
            idEmpresa = idEmpresa.empresa_id
            const {data: listaFuncionario, erroFuncionario} = await supabase
                .from("funcionarios")
                .select("nome", "cpf")
                .eq("startup_id", idEmpresa)

            if (!listaFuncionario || erroFuncionario){
                alert("Erro: " + erroFuncionario)
            }
            else{
                console.log(listaFuncionario)
                setListaFuncionarios(listaFuncionario)
            }
        }
        
        listarFuncionarios()
    }, [])


    useEffect(() => {
        async function contarTarefas() {
            const [tarefasBanco, errorBanco] = await supabase
                .from("tarefas")
                .select("*", {count: "exact", head: true})

            if (errorBanco){
                alert("Erro: " + errorBanco)
            }
            else{
                setTotalTarefas(tarefasBanco)
            }
        }

        contarTarefas();
    }, [])

    if (totalTarefas === 0){
        return(
            <>
            <form className={abrirCriarTarefa ? "criarTarefa" : "criarTarefa Escondido"}>
                <div className="esquerdaTarefa">
                    <label>Nome da tarefa</label>
                    <input type="text" />
                    <label>Descrição</label>
                    <textarea name="descricao" id="descricao"></textarea>
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
                    />
                    <Calendar
                        onChange={(date) => setPrazoTarefa(date)}
                        value={prazoTarefa || null}
                        className={"tarefaCalendario"}
                    />
                </div>
            </form>
            <main className="semTarefas">
                <h1>Nenhuma tarefa registrada</h1>
                <button className={abrirCriarTarefa ? "abrirFormsTarefaBotao escondido" : "abrirFormsTarefaBotao"} onClick={() => setAbrirCriarTarefa(!abrirCriarTarefa)}>Adicionar Tarefa</button>
            </main>
            </>
        )
    } 
    else{
        return(
            <main>
                
            </main>
        )
    }
}

export default Tarefas