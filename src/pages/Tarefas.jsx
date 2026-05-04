import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark, faSquarePlus } from "@fortawesome/free-regular-svg-icons";
import { faFilter, faChevronDown } from "@fortawesome/free-solid-svg-icons";

import "../styles/Tarefas.css";
import Calendar from "react-calendar";

function Tarefas() {
  const [abrirCriarTarefa, setAbrirCriarTarefa] = useState(false);
  const [totalTarefas, setTotalTarefas] = useState(0);
  const [listaFuncionarios, setListaFuncionarios] = useState([]);
  const [listaProjetos, setListaProjetos] = useState([]);
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Toast
  const [abrirToastErro, setAbrirToastErro] = useState(false);
  const [mensagemErroToast, setMensagemErroToast] = useState("");
  const [abrirToastCerto, setAbrirToastCerto] = useState(false);
  const [mensagemCertoToast, setMensagemCertoToast] = useState("");

  // Criação
  const [nomeTarefa, setNomeTarefa] = useState("");
  const [descricaoTarefa, setDescricaoTarefa] = useState("");
  const [responsavelTarefa, setResponsavelTarefa] = useState("");
  const [prioridadeTarefa, setPrioridadeTarefa] = useState("alta");
  const [projetoTarefa, setProjetoTarefa] = useState(null);
  const [prazoTarefa, setPrazoTarefa] = useState("");
  const [subtarefas, setSubtarefas] = useState([]);
  const [novaSubtarefa, setNovaSubtarefa] = useState("");

  const usuario = localStorage.getItem("usuario");
  const usuarioObj = usuario ? JSON.parse(usuario) : null;

  const CPF = usuarioObj?.cpf ?? "";
  const idEmpresa = usuarioObj?.empresa_id;

  const isFuncionario = usuarioObj?.cargo === "funcionario";

  const [escopoTarefas, setEscopoTarefas] = useState(null);

  // Lista tarefas
  const [tarefas, setTarefas] = useState([]);
  const [tarefasAbertas, setTarefasAbertas] = useState({});
  const [filtro, setFiltro] = useState("todas");

  // ── NOVO: filtros em pílula ──────────────────────────────────────────
  const [filtroPrioridade, setFiltroPrioridade] = useState("");
  const [filtroResponsavel, setFiltroResponsavel] = useState("");

  const [refreshTarefas, setRefreshTarefas] = useState(0);

  useEffect(() => {
    async function detectarEscopo() {
      if (!idEmpresa) return;
      const { data: startup } = await supabase
        .from("startups").select("id").eq("id", idEmpresa).maybeSingle();
      if (startup) { setEscopoTarefas("startup"); return; }
      const { data: empresa } = await supabase
        .from("empresas").select("id").eq("id", idEmpresa).maybeSingle();
      if (empresa) setEscopoTarefas("empresa");
    }
    detectarEscopo();
  }, [idEmpresa]);

  function adicionarSubtarefa() {
    if (!novaSubtarefa.trim()) return;
    setSubtarefas([...subtarefas, novaSubtarefa]);
    setNovaSubtarefa("");
  }

  function toggleTarefa(id) {
    setTarefasAbertas((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // ── NOVO: marcar/desmarcar subtarefa ────────────────────────────────
  async function toggleSubtarefa(idSubtarefa, concluida) {
    const { error } = await supabase
      .from("subtarefas")
      .update({ concluida: !concluida })
      .eq("id_subtarefa", idSubtarefa);
    if (error) { console.error("Erro ao atualizar subtarefa:", error); return; }
    // Atualiza estado local sem recarregar tudo
    setTarefas((prev) =>
      prev.map((t) => ({
        ...t,
        subtarefas: (t.subtarefas || []).map((s) =>
          s.id_subtarefa === idSubtarefa ? { ...s, concluida: !concluida } : s
        ),
      }))
    );
  }

  useEffect(() => {
    async function listarFuncionarios() {
      if (!idEmpresa || !escopoTarefas) return;
      let query = supabase.from("funcionarios").select("nome, cpf");
      if (escopoTarefas === "startup") query = query.eq("startup_id", idEmpresa);
      else if (escopoTarefas === "empresa") query = query.eq("empresa_id", idEmpresa);
      const { data: listaFuncionario, error: erroFuncionario } = await query;
      if (!listaFuncionario || erroFuncionario) {
        alert("Erro: " + erroFuncionario);
      } else {
        setListaFuncionarios(listaFuncionario);
      }
    }
    listarFuncionarios();
  }, [idEmpresa, escopoTarefas]);

  useEffect(() => {
    async function listarProjetos() {
      if (!idEmpresa || !escopoTarefas) return;
      let query = supabase.from("projetos").select("id_projeto, nome_projeto");
      if (escopoTarefas === "startup") query = query.eq("startup_id", idEmpresa);
      else query = query.eq("empresa_id", idEmpresa);
      const { data } = await query;
      setListaProjetos(data || []);
    }
    listarProjetos();
  }, [idEmpresa, escopoTarefas]);

  useEffect(() => {
    async function contarTarefas() {
      if (!idEmpresa || !escopoTarefas) return;
      let query = supabase.from("tarefas").select("*", { count: "exact", head: true });
      if (escopoTarefas === "startup") query = query.eq("id_startup", idEmpresa);
      else if (escopoTarefas === "empresa") query = query.eq("id_empresa", idEmpresa);
      if (isFuncionario) query = query.eq("cpf_responsavel", CPF);
      const { count, error: errorCount } = await query;
      if (errorCount) alert("Erro: " + errorCount);
      else setTotalTarefas(count ?? 0);
    }
    contarTarefas();
  }, [idEmpresa, CPF, isFuncionario, escopoTarefas, refreshTarefas]);

  useEffect(() => {
    async function listarTarefas() {
      if (!idEmpresa || !escopoTarefas) return;
      let query = supabase.from("tarefas").select("*");
      if (escopoTarefas === "startup") query = query.eq("id_startup", idEmpresa);
      else if (escopoTarefas === "empresa") query = query.eq("id_empresa", idEmpresa);
      const { data: tarefasData, error: erroTarefas } = await query;
      if (erroTarefas) { console.error(erroTarefas); return; }

      const { data: subtarefasData, error: erroSub } = await supabase
        .from("subtarefas").select("*");
      if (erroSub) { console.error(erroSub); return; }

      const tarefasComSub = (tarefasData || []).map((tarefa) => ({
        ...tarefa,
        subtarefas: (subtarefasData || []).filter((sub) => sub.id_tarefa === tarefa.id),
      }));

      const tarefasFiltradasResponsavel = isFuncionario
        ? tarefasComSub.filter((t) => t.cpf_responsavel === CPF)
        : tarefasComSub;

      setTarefas(tarefasFiltradasResponsavel);
    }
    listarTarefas();
  }, [idEmpresa, CPF, isFuncionario, escopoTarefas, refreshTarefas]);

  async function cadastrarTarefa(e) {
    e.preventDefault();

    if (isFuncionario) {
      setMensagemErroToast("Funcionário não pode cadastrar tarefas.");
      setAbrirToastErro(true);
      await delay(2000);
      setAbrirToastErro(false);
      return;
    }
    if (!nomeTarefa) {
      setMensagemErroToast("De um nome para a tarefa");
      setAbrirToastErro(true); await delay(2000); setAbrirToastErro(false); return;
    }
    if (!descricaoTarefa) {
      setMensagemErroToast("De uma descrição para sua tarefa");
      setAbrirToastErro(true); await delay(2000); setAbrirToastErro(false); return;
    }
    if (!responsavelTarefa) {
      setMensagemErroToast("Coloque um responsavel para tarefa");
      setAbrirToastErro(true); await delay(2000); setAbrirToastErro(false); return;
    }
    if (!prazoTarefa) {
      setMensagemErroToast("Coloque um prazo");
      setAbrirToastErro(true); await delay(2000); setAbrirToastErro(false); return;
    }

    const { data: startup } = await supabase
      .from("startups").select("id").eq("dono_cpf", CPF).maybeSingle();

    let idStartupSelecionado = null;
    let idEmpresaTarefaSelecionada = null;

    if (startup) {
      idStartupSelecionado = startup.id;
    } else {
      const { data: empresa } = await supabase
        .from("empresas").select("id").eq("dono_cpf", CPF).maybeSingle();
      if (empresa) idEmpresaTarefaSelecionada = empresa.id;
    }

    const { data: tarefaCriada, error: errorTarefa } = await supabase
      .from("tarefas")
      .insert([{
        titulo: nomeTarefa,
        descricao: descricaoTarefa,
        cpf_responsavel: responsavelTarefa,
        prioridade: prioridadeTarefa,
        projeto: projetoTarefa,
        dia_prazo: prazoTarefa,
        id_empresa: idEmpresaTarefaSelecionada,
        id_startup: idStartupSelecionado,
      }])
      .select().single();

    if (errorTarefa) { alert("Erro: " + errorTarefa); return; }

    const idTarefa = tarefaCriada.id;

    if (subtarefas.length > 0) {
      const subtarefasFormatadas = subtarefas.map((sub) => ({
        id_tarefa: idTarefa,
        nome_subtarefa: sub,
        concluida: false,
        criado_subtarefa: new Date(),
      }));
      const { error: errorSub } = await supabase.from("subtarefas").insert(subtarefasFormatadas);
      if (errorSub) { alert("Erro ao salvar subtarefas: " + errorSub.message); return; }
    }

    setMensagemCertoToast("Tarefa Cadastrada!");
    setAbrirToastCerto(true);
    await delay(2000);
    setAbrirToastCerto(false);

    setAbrirCriarTarefa(false);
    setFiltro("todas");
    setRefreshTarefas((v) => v + 1);
  }

  // ── Filtros combinados ───────────────────────────────────────────────
  const tarefasBase = isFuncionario
    ? tarefas.filter((t) => t.cpf_responsavel === CPF)
    : tarefas;

  const tarefasFiltradas = tarefasBase.filter((tarefa) => {
    const subt = tarefa.subtarefas || [];
    const total = subt.length;
    const concluidas = subt.filter((s) => s.concluida).length;

    if (filtro === "pendentes") return concluidas === 0;
    if (filtro === "em_progresso") return concluidas > 0 && concluidas < total;
    if (filtro === "concluidas") return total > 0 && concluidas === total;

    // filtros em pílula
    if (filtroPrioridade && tarefa.prioridade !== filtroPrioridade) return false;
    if (filtroResponsavel && tarefa.cpf_responsavel !== filtroResponsavel) return false;

    return true;
  });

  const lista = (
    <main className="mainTarefas">
      <div className="botoesTopTarefas">
        <div className="filtrosdotoptarefas">
        {/* ── Filtros originais (botões) ── */}
        <div className="filtrosTarefas">
          {["todas","pendentes","em_progresso","concluidas"].map((f) => (
            <button
              key={f}
              className={filtro === f ? "botaoFiltroTarefas ativo" : "botaoFiltroTarefas"}
              onClick={() => setFiltro(f)}
            >
              {{ todas:"Todas", pendentes:"Pendentes", em_progresso:"Em progresso", concluidas:"Concluídas" }[f]}
            </button>
          ))}
        </div>

        {/* ── NOVO: selects em pílula ── */}
        <div className="filtrosPilula">
          <span className="filtrosPilulaIcone">
            <FontAwesomeIcon icon={faFilter} /> Filtros:
          </span>

          <div className="filtrosPilulaSelect">
            <select value={filtroPrioridade} onChange={(e) => setFiltroPrioridade(e.target.value)}>
              <option value="">Todas as prioridades</option>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
            <FontAwesomeIcon icon={faChevronDown} className="filtrosPilulaChevron" />
          </div>

          {!isFuncionario && (
            <div className="filtrosPilulaSelect">
              <select value={filtroResponsavel} onChange={(e) => setFiltroResponsavel(e.target.value)}>
                <option value="">Todos os responsáveis</option>
                {listaFuncionarios.map((f) => (
                  <option key={f.cpf} value={f.cpf}>{f.nome}</option>
                ))}
              </select>
              <FontAwesomeIcon icon={faChevronDown} className="filtrosPilulaChevron" />
            </div>
          )}

          <span className="filtrosResultados">{tarefasFiltradas.length} resultado(s)</span>
        </div>
        </div>

        {!isFuncionario && (
          <button
            className={abrirCriarTarefa ? "abrirFormsTarefaBotao escondido" : "abrirFormsTarefaBotao"}
            onClick={() => setAbrirCriarTarefa(!abrirCriarTarefa)}
          >
            Adicionar Tarefa
          </button>
        )}
      </div>

      <ul className="listaTarefas">
        {tarefasFiltradas.map((tarefa) => {
          const aberta = tarefasAbertas[tarefa.id];
          const subs = tarefa.subtarefas || [];
          const total = subs.length;
          const concluidas = subs.filter((s) => s.concluida).length;

          const statusLabel =
            total === 0 || concluidas === 0
              ? "À fazer"
              : concluidas === total
                ? "Concluída"
                : "Em progresso";

          const prioridadeLabel =
            tarefa.prioridade === "alta" ? "Alta"
            : tarefa.prioridade === "media" ? "Média"
            : "Baixa";

          return (
            <li key={tarefa.id} className={`tarefaItem prioridade-${tarefa.prioridade}`}>
              <div className="tarefaTop">
                <div className="tarefaEsquerda">
                  <span className={`dotPrioridade dot-${tarefa.prioridade}`}></span>
                  <div className="nomeDescricao" onClick={() => toggleTarefa(tarefa.id)}>
                    <h3>{tarefa.titulo}</h3>
                    <p>{tarefa.descricao}</p>
                  </div>
                </div>
                <div className="tarefaDireita">
                  <span className={`badgePrioridade badge-${tarefa.prioridade}`}>{prioridadeLabel}</span>
                  <span className="badgeStatus">{statusLabel}</span>
                  {total > 0 && <span className="progressoTarefa">{concluidas}/{total}</span>}
                  <button className="botaoToggle" onClick={() => toggleTarefa(tarefa.id)}>
                    {aberta ? "▲" : "▼"}
                  </button>
                </div>
              </div>

              {/* ── NOVO: subtarefas com checkbox ── */}
              <ul className={`subtarefasLista ${aberta ? "ativo" : ""}`}>
                <h2>Sub-tarefas ({concluidas}/{total})</h2>
                {subs.length === 0 ? (
                  <p className="semSubtarefas">Nenhuma subtarefa</p>
                ) : (
                  subs.map((sub) => (
                    <li key={sub.id_subtarefa} className="subtarefaItem">
                      <label className="subtarefaCheckLabel">
                        <input
                          type="checkbox"
                          className="subtarefaCheckbox"
                          checked={!!sub.concluida}
                          onChange={() => toggleSubtarefa(sub.id_subtarefa, sub.concluida)}
                        />
                        <span className="subtarefaCheckCustom" />
                        <span className={sub.concluida ? "subtarefaTextoRiscado" : ""}>
                          {sub.nome_subtarefa}
                        </span>
                      </label>
                    </li>
                  ))
                )}
              </ul>
            </li>
          );
        })}
      </ul>
    </main>
  );

  const form = abrirCriarTarefa ? (
    <div className="tarefasFormOverlay" onClick={(e) => { if (e.target === e.currentTarget) setAbrirCriarTarefa(false); }}>
      <form onSubmit={cadastrarTarefa} className="tarefasFormModal">
        <div className="tarefasFormHeader">
          <h2>Nova Tarefa</h2>
          <button type="button" className="tarefasFormFechar" onClick={() => setAbrirCriarTarefa(false)}>✕</button>
        </div>

        <div className="tarefasFormCorpo">
          {/* Esquerda */}
          <div className="esquerdaTarefa">
            <label>Nome da tarefa</label>
            <input value={nomeTarefa} onChange={(e) => setNomeTarefa(e.target.value)} type="text" placeholder="Ex: Criar briefing da campanha" />

            <label>Descrição</label>
            <textarea
              value={descricaoTarefa}
              onChange={(e) => setDescricaoTarefa(e.target.value)}
              name="descricao"
              id="descricao"
              placeholder="Descreva o objetivo da tarefa..."
            />

            <div className="linhaInputTarefa">
              <label>Responsável</label>
              <select value={responsavelTarefa} onChange={(e) => setResponsavelTarefa(e.target.value)}>
                <option value={""}>Selecione...</option>
                {listaFuncionarios.map((funcionario) => (
                  <option key={funcionario.cpf} value={funcionario.cpf}>
                    {funcionario.nome}
                  </option>
                ))}
              </select>

              <label>Prioridade</label>
              <select value={prioridadeTarefa} onChange={(e) => setPrioridadeTarefa(e.target.value)}>
                <option value={"alta"}>Alta</option>
                <option value={"media"}>Média</option>
                <option value={"baixa"}>Baixa</option>
              </select>
            </div>

            <div className="linhaInputTarefa">
              <label>Projeto</label>
              <select value={projetoTarefa || ""} onChange={(e) => setProjetoTarefa(e.target.value || null)}>
                <option value={""}>Nenhum</option>
                {listaProjetos.map((p) => (
                  <option key={p.id_projeto} value={p.id_projeto}>
                    {p.nome_projeto}
                  </option>
                ))}
              </select>

              <div className="botoesTarefas">
                <button type="submit">Criar Tarefa</button>
                <button className="botaoFecharTarefas" onClick={() => setAbrirCriarTarefa(false)} type="button">
                  Fechar
                </button>
              </div>
            </div>
          </div>

          {/* Direita */}
          <div className="direitaTarefa">
            <label>Prazo</label>
            <input
              value={prazoTarefa ? prazoTarefa.toISOString().split("T")[0] : ""}
              onChange={(e) => setPrazoTarefa(e.target.value ? new Date(e.target.value + "T12:00:00") : null)}
              type="date"
              disabled
            />

            <Calendar onChange={(date) => setPrazoTarefa(date)} value={prazoTarefa || null} className={"tarefaCalendario"} />

            <label>SubTarefas</label>
            <div className="subtarefasBox">
              <div className="inputSubtarefa">
                <input
                  value={novaSubtarefa}
                  onChange={(e) => setNovaSubtarefa(e.target.value)}
                  placeholder="Adicione uma subtarefa..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); adicionarSubtarefa(); }
                  }}
                />
                <button className="botaoAdicionarSubtarefa" type="button" onClick={adicionarSubtarefa}>
                  <FontAwesomeIcon icon={faSquarePlus} />
                </button>
              </div>

              <ul className="listaSubtarefas">
                {subtarefas.map((sub, index) => (
                  <li className="subtarefa" key={index}>
                    {sub}
                    <button
                      type="button"
                      onClick={() => setSubtarefas(subtarefas.filter((_, i) => i !== index))}
                    >
                      <FontAwesomeIcon icon={faCircleXmark} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>
  ) : null;

  if (totalTarefas === 0) {
    return (
      <>
        <div className={!abrirToastErro ? "modalAvisoTarefas" : "modalAvisoTarefas ativo"}>
          <h3>{mensagemErroToast}</h3>
        </div>
        <div className={!abrirToastCerto ? "toast" : "toast ativo"}>{mensagemCertoToast}</div>
        {form}
        <main className="semTarefas">
          <h1>Nenhuma tarefa registrada</h1>
          {!isFuncionario && (
            <button
              className={abrirCriarTarefa ? "abrirFormsTarefaBotao escondido" : "abrirFormsTarefaBotao"}
              onClick={() => setAbrirCriarTarefa(!abrirCriarTarefa)}
            >
              Adicionar Tarefa
            </button>
          )}
        </main>
      </>
    );
  }

  return (
    <>
      <div className={!abrirToastErro ? "modalAvisoTarefas" : "modalAvisoTarefas ativo"}>
        <h3>{mensagemErroToast}</h3>
      </div>
      <div className={!abrirToastCerto ? "toast" : "toast ativo"}>{mensagemCertoToast}</div>
      {form}
      {lista}
    </>
  );
}

export default Tarefas;