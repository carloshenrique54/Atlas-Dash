import { useEffect, useState } from "react"
import { supabase } from "../services/supabase"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faArrowLeft, faListCheck, faCircleCheck, faTriangleExclamation,
  faUsers, faCalendarDays, faChevronDown, faChevronUp,
} from "@fortawesome/free-solid-svg-icons"
import "../styles/Equipe.css"
import "../styles/Kanban.css"
import Kanban from "../components/Kanban"

const PRIO_LABEL = { alta: "Alta", media: "Média", baixa: "Baixa" }

function ProjetoDetalhe({ projeto, funcionarios, escopo, idEmpresa, isDono, onVoltar }) {
  const [aba,        setAba]        = useState("visao")
  const [tarefas,    setTarefas]    = useState([])
  const [subtarefas, setSubtarefas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [abertas,    setAbertas]    = useState({})

  // ── Carregar tarefas do projeto ──────────────────────────────────────
  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      const { data: t } = await supabase
        .from("tarefas")
        .select("*")
        .eq("id_projeto", projeto.id_projeto)

      if (t && t.length > 0) {
        const ids = t.map(x => x.id)
        const { data: sub } = await supabase
          .from("subtarefas")
          .select("*")
          .in("id_tarefa", ids)
        setSubtarefas(sub || [])
      }

      setTarefas(t || [])
      setCarregando(false)
    }
    carregar()
  }, [projeto.id_projeto])

  // ── Tarefas com subtarefas embutidas (para o componente Kanban) ──────
  const tarefasComSub = tarefas.map(t => ({
    ...t,
    subtarefas: subtarefas.filter(s => s.id_tarefa === t.id),
  }))

  // ── Callback do Kanban ───────────────────────────────────────────────
  function onKanbanUpdate(idTarefa, updates) {
    setTarefas(prev => prev.map(t => t.id === idTarefa ? { ...t, ...updates } : t))
  }

  // ── Helpers ──────────────────────────────────────────────────────────
  function getParticipantes() {
    const arr = projeto.cpf_participantes
    if (!arr) return []
    const cpfs = Array.isArray(arr) ? arr : arr.replace(/[{}]/g, "").split(",").filter(Boolean)
    return cpfs.map(cpf => funcionarios.find(f => f.cpf === cpf)).filter(Boolean)
  }

  function formatarData(d) {
    if (!d) return "—"
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
  }

  function corProgresso(pct) {
    if (pct >= 100) return "#1D9E75"
    if (pct >= 60)  return "#3647ff"
    if (pct >= 30)  return "#EF9F27"
    return "#E24B4A"
  }

  const participantes = getParticipantes()
  const total        = tarefas.length
  const concluidas   = tarefas.filter(t => t.concluido).length
  const atrasadas    = tarefas.filter(t => !t.concluido && t.dia_prazo && new Date(t.dia_prazo) < new Date()).length
  const progresso    = total > 0 ? Math.round((concluidas / total) * 100) : 0
  const corProg      = corProgresso(progresso)

  const prazoPassado = projeto.prazo_projeto && new Date(projeto.prazo_projeto) < new Date()
  const status = progresso >= 100
    ? { label: "Concluído", cls: "projetoStatus--concluido" }
    : prazoPassado
      ? { label: "Atrasado", cls: "projetoStatus--atrasado" }
      : { label: "Ativo",    cls: "projetoStatus--ativo" }

  const tagsArr = Array.isArray(projeto.tags)
    ? projeto.tags
    : (projeto.tags ? Object.values(projeto.tags) : [])

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="detalhePage">

      {/* Voltar */}
      <button className="detalhVoltar" onClick={onVoltar}>
        <FontAwesomeIcon icon={faArrowLeft} /> Voltar
      </button>

      {/* Header */}
      <div className="projetoDetalheHeaderContainer">
        <div className="projetoDetalheHeader">
          <div className="projetoDetalheHeaderEsq">
            <div className="projetoDetalheNomeLinha">
              <h2>{projeto.nome_projeto}</h2>
              <span className={`projetoStatusBadge ${status.cls}`}>{status.label}</span>
            </div>
            {projeto.descricao_projeto && (
              <p className="projetoDetalheDesc">{projeto.descricao_projeto}</p>
            )}
            {tagsArr.length > 0 && (
              <div className="projetoTags" style={{ marginTop: 8 }}>
                {tagsArr.map((t, i) => (
                  <span key={i} className="projetoTagChip projetoTagChip--card">{t}</span>
                ))}
              </div>
            )}
          </div>
          <div className="projetoDetalheHeaderDir">
            <div className="projetoDetalheMeta">
              <FontAwesomeIcon icon={faCalendarDays} />
              <span>Prazo: {formatarData(projeto.prazo_projeto)}</span>
            </div>
            <div className="projetoDetalheMeta">
              <FontAwesomeIcon icon={faUsers} />
              <span>{participantes.length} participante(s)</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="detalheStatsGrid">
          {[
            { label: "Tarefas",       valor: total,               cor: "neutro",   icon: faListCheck },
            { label: "Concluídas",    valor: concluidas,          cor: "verde",    icon: faCircleCheck },
            { label: "Participantes", valor: participantes.length, cor: "amarelo", icon: faUsers },
            { label: "Atrasadas",     valor: atrasadas,           cor: "vermelho", icon: faTriangleExclamation },
          ].map(s => (
            <div key={s.label} className={`detalheStatCard detalheStatCard--${s.cor}`}>
              <FontAwesomeIcon icon={s.icon} className="detalheStatIcone" />
              <strong>{s.valor}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      

        {/* Progress */}
        <div className="detalheProgressoWrap">
          <div className="detalheProgressoTopo">
            <span>Progresso do projeto</span>
            <strong style={{ color: corProg }}>{progresso}%</strong>
          </div>
          <progress
            className="detalheProgressoBar"
            value={progresso}
            max={100}
            style={{ "--proj-cor": corProg }}
          />
        </div>
      </div>

      {/* Abas */}
      <div className="detalheAbas">
        {[
          { id: "visao",         label: `Visão Geral (${total})` },
          { id: "kanban",        label: "Tarefas" },
          { id: "participantes", label: `Participantes (${participantes.length})` },
        ].map(a => (
          <button
            key={a.id}
            className={`detalheAba ${aba === a.id ? "ativo" : ""}`}
            onClick={() => setAba(a.id)}
          >
            {a.label}
          </button>
        ))}
      </div>

      {carregando ? (
        <div className="projetosLoading">Carregando tarefas...</div>
      ) : (
        <>
          {/* ── ABA: VISÃO GERAL ── */}
          {aba === "visao" && (
            <div className="detalheConteudo">
              {tarefas.length === 0 && (
                <p className="detalheVazio">Nenhuma tarefa vinculada a este projeto</p>
              )}
              {tarefasComSub.map(t => {
                const subs        = t.subtarefas
                const conc        = subs.filter(s => s.concluida).length
                const aberta      = abertas[t.id]
                const responsavel = funcionarios.find(f => f.cpf === t.cpf_responsavel)

                const statusLabel = t.concluido
                  ? "Concluída"
                  : !t.concluido && t.dia_prazo && new Date(t.dia_prazo) < new Date()
                    ? "Atrasada"
                    : conc > 0 ? "Em progresso" : "À fazer"

                const statusCls = t.concluido ? "badge-concluida"
                  : statusLabel === "Atrasada" ? "badgeStatus--atrasada"
                  : conc > 0 ? "badgeStatus--em_progresso"
                  : ""

                return (
                  <div key={t.id} className={`detalheTarefaItem prioridade-${t.prioridade}`}>
                    <div className="detalheTarefaTopo">
                      <div className="detalheTarefaEsq">
                        <span className={`dotPrioridade dot-${t.prioridade}`} />
                        <div>
                          <h3>{t.titulo}</h3>
                          <p>{t.descricao}</p>
                        </div>
                      </div>
                      <div className="detalheTarefaDir">
                        <span className={`badgePrioridade badge-${t.prioridade}`}>
                          {PRIO_LABEL[t.prioridade]}
                        </span>
                        <span className={`badgeStatus ${statusCls}`}>{statusLabel}</span>
                        {subs.length > 0 && (
                          <span className="progressoTarefa">{conc}/{subs.length}</span>
                        )}
                        {responsavel && (
                          <span className="projetoDetalheResponsavel">
                            {responsavel.nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()}
                          </span>
                        )}
                        {subs.length > 0 && (
                          <button
                            className="botaoToggle"
                            onClick={() => setAbertas(p => ({ ...p, [t.id]: !p[t.id] }))}
                          >
                            <FontAwesomeIcon icon={aberta ? faChevronUp : faChevronDown} />
                          </button>
                        )}
                      </div>
                    </div>

                    {aberta && subs.length > 0 && (
                      <ul className="detalheSubLista">
                        {subs.map(s => (
                          <li key={s.id_subtarefa} className={s.concluida ? "subtarefaTextoRiscado" : ""}>
                            {s.nome_subtarefa}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ── ABA: KANBAN — usa o mesmo componente de Tarefas ── */}
          {aba === "kanban" && (
            <Kanban
              tarefas={tarefasComSub}
              listaFuncionarios={funcionarios}
              isDono={isDono}
              onUpdateTarefa={onKanbanUpdate}
            />
          )}

          {/* ── ABA: PARTICIPANTES ── */}
          {aba === "participantes" && (
            <div className="detalheConteudo">
              {participantes.length === 0 && (
                <p className="detalheVazio">Nenhum participante neste projeto</p>
              )}
              {participantes.map(f => {
                const iniciais = f.nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
                const tf       = tarefas.filter(t => t.cpf_responsavel === f.cpf)
                const tfConc   = tf.filter(t => t.concluido).length
                return (
                  <div key={f.cpf} className="detalheRelCard projetoParticipanteCard">
                    <div className="detalheAvatar">{iniciais}</div>
                    <div className="projetoParticipanteInfo">
                      <p className="perfilMembroNome">{f.nome}</p>
                      <p className="perfilMembroEmail">{f.email}</p>
                    </div>
                    <div className="projetoParticipanteTarefas">
                      <span>{tfConc}/{tf.length} tarefas</span>
                      {tf.length > 0 && (
                        <progress
                          value={tfConc}
                          max={tf.length}
                          className="projetoParticipanteBar"
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ProjetoDetalhe