import { useState } from "react"
import { supabase } from "../services/supabase"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faGripVertical, faCalendarDays,
  faCircleExclamation, faCircleMinus, faCircleCheck,
} from "@fortawesome/free-solid-svg-icons"
import "../styles/Kanban.css"

// ── Coluna = prioridade da tarefa ─────────────────────────────────────
function getColuna(tarefa) {
  return tarefa.prioridade || "baixa"
}

const COLUNAS = [
  { id: "alta",  label: "Alta",  icon: faCircleExclamation, cor: "#ffe4e4", corOver: "#ffc9c9", corBorder: "#E24B4A" },
  { id: "media", label: "Média", icon: faCircleMinus,       cor: "#fff4e0", corOver: "#ffe8b8", corBorder: "#EF9F27" },
  { id: "baixa", label: "Baixa", icon: faCircleCheck,       cor: "#e6f9f1", corOver: "#c8f5cb", corBorder: "#1D9E75" },
]

const PRIO_LABEL = { alta: "Alta", media: "Média", baixa: "Baixa" }

function formatarData(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
}

function Kanban({ tarefas, listaFuncionarios, isDono, onUpdateTarefa }) {
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)

  function getIniciais(cpf) {
    const func = listaFuncionarios.find(f => f.cpf === cpf)
    if (!func) return "?"
    return func.nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
  }

  function getNome(cpf) {
    const func = listaFuncionarios.find(f => f.cpf === cpf)
    return func?.nome ?? null
  }

  async function handleDrop(colunaDestino) {
    setDragOver(null)
    if (!dragging) return

    if (dragging.prioridade === colunaDestino) { setDragging(null); return }

    const { error } = await supabase
      .from("tarefas")
      .update({ prioridade: colunaDestino })
      .eq("id", dragging.id)

    if (!error && onUpdateTarefa) {
      onUpdateTarefa(dragging.id, { prioridade: colunaDestino })
    }

    setDragging(null)
  }

  return (
    <div className="kanbanBoard">
      {COLUNAS.map(col => {
        const colTarefas = tarefas.filter(t => getColuna(t) === col.id)
        const eOver      = dragOver === col.id

        return (
          <div
            key={col.id}
            className={`kanbanColuna ${eOver ? "kanbanColuna--over" : ""}`}
            onDragOver={e => { e.preventDefault(); setDragOver(col.id) }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(null) }}
            onDrop={() => handleDrop(col.id)}
          >
            <div className="kanbanColunaHeader" style={{ background: eOver ? col.corOver : col.cor }}>
              <div className="kanbanColunaHeaderEsq">
                <FontAwesomeIcon
                  icon={col.icon}
                  className="kanbanColunaIcone"
                  style={{ color: col.corBorder }}
                />
                <span className="kanbanColunaLabel">{col.label}</span>
              </div>
              <span className="kanbanCount">{colTarefas.length}</span>
            </div>

            <div className="kanbanCards">
              {colTarefas.map(t => {
                const subs           = t.subtarefas || []
                const totalSubs      = subs.length
                const concSubs       = subs.filter(s => s.concluida).length
                const pctSubs        = totalSubs > 0 ? Math.round((concSubs / totalSubs) * 100) : 0
                const isDraggingThis = dragging?.id === t.id
                const eAtrasada      = !t.concluido && t.dia_prazo && new Date(t.dia_prazo) < new Date()

                return (
                  <div
                    key={t.id}
                    className={`kanbanCard prioridade-${t.prioridade}
                      ${isDraggingThis ? "kanbanCard--dragging" : ""}
                      ${isDono        ? "kanbanCard--draggable" : ""}
                      ${t.concluido   ? "kanbanCard--concluido" : ""}
                    `}
                    draggable={isDono}
                    onDragStart={() => { if (isDono) setDragging(t) }}
                    onDragEnd={() => { setDragging(null); setDragOver(null) }}
                  >
                    <div className="kanbanCardTopo">
                      <span className={`dotPrioridade dot-${t.prioridade}`} />
                      <h4 className="kanbanCardTitulo">{t.titulo}</h4>
                      {isDono && (
                        <FontAwesomeIcon icon={faGripVertical} className="kanbanDragIcone" />
                      )}
                    </div>

                    {t.descricao && (
                      <p className="kanbanCardDesc">{t.descricao}</p>
                    )}

                    {/* Status de conclusão no lugar do badge de prioridade */}
                    <span className={`badgeStatus ${t.concluido ? "badge-concluida" : concSubs > 0 ? "badgeStatus--em_progresso" : ""}`}>
                      {t.concluido ? "Concluída" : concSubs > 0 ? "Em progresso" : "À fazer"}
                    </span>

                    {totalSubs > 0 && (
                      <div className="kanbanProgressoWrap">
                        <div className="kanbanProgressoTrack">
                          <div
                            className="kanbanProgressoFill"
                            style={{
                              width: `${pctSubs}%`,
                              background: concSubs === totalSubs ? "#1D9E75" : "#3647ff",
                            }}
                          />
                        </div>
                        <span className="kanbanProgressoText">{concSubs}/{totalSubs}</span>
                      </div>
                    )}

                    <div className="kanbanCardRodape">
                      {t.cpf_responsavel && (
                        <div className="kanbanAvatar" title={getNome(t.cpf_responsavel)}>
                          {getIniciais(t.cpf_responsavel)}
                        </div>
                      )}
                      {t.dia_prazo && (
                        <span className={`kanbanPrazo ${eAtrasada ? "kanbanPrazo--atrasada" : ""}`}>
                          <FontAwesomeIcon icon={faCalendarDays} />
                          {formatarData(t.dia_prazo)}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}

              {colTarefas.length === 0 && (
                <div className="kanbanVazio">
                  {isDono ? "Arraste uma tarefa aqui" : "Nenhuma tarefa"}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default Kanban