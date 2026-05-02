import { useEffect, useState } from "react"
import { supabase } from "../services/supabase"
import Calendar from "react-calendar"
import "react-calendar/dist/Calendar.css"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faListCheck,
  faTriangleExclamation,
  faCircleCheck,
  faClock,
} from "@fortawesome/free-solid-svg-icons"

const DIAS_PROXIMO_PRAZO = 5

function DashboardFuncionario({ usuarioObj }) {
  const CPF  = usuarioObj?.cpf ?? ""
  const nome = usuarioObj?.nome?.split(" ")[0] ?? "Colaborador"

  const [tarefas, setTarefas]       = useState([])
  const [carregando, setCarregando] = useState(true)
  const [dataCal, setDataCal]       = useState(new Date())

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const proxLimit = new Date(hoje)
  proxLimit.setDate(proxLimit.getDate() + DIAS_PROXIMO_PRAZO)

  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      const { data: t } = await supabase
        .from("tarefas")
        .select("*")
        .eq("cpf_responsavel", CPF)
        .order("dia_criado", { ascending: false })
      setTarefas(t || [])
      setCarregando(false)
    }
    carregar()
  }, [CPF])

  // ── helpers — usa coluna `concluido` diretamente ─────────────────────
  function isAtrasada(t) {
    if (t.concluido) return false
    if (!t.dia_prazo) return false
    const prazo = new Date(t.dia_prazo)
    prazo.setHours(0, 0, 0, 0)
    return prazo < hoje
  }

  function isProximo(t) {
    if (t.concluido) return false
    if (!t.dia_prazo) return false
    const prazo = new Date(t.dia_prazo)
    prazo.setHours(0, 0, 0, 0)
    return prazo >= hoje && prazo <= proxLimit
  }

  // ── stats cards ──────────────────────────────────────────────────────
  const pendentes      = tarefas.filter(t => !t.concluido && !isAtrasada(t)).length
  const atrasadas      = tarefas.filter(isAtrasada).length
  const proximosPrazos = tarefas.filter(isProximo).length

  const inicioSemana = new Date(hoje)
  inicioSemana.setDate(hoje.getDate() - hoje.getDay())
  const concluidasSemana = tarefas.filter(t => {
    if (!t.concluido) return false
    const criado = new Date(t.dia_criado)
    return criado >= inicioSemana
  }).length

  // ── visão geral por prioridade ───────────────────────────────────────
  function statsPrioridade(prioridade) {
    const tf    = tarefas.filter(t => t.prioridade === prioridade)
    const total = tf.length
    const conc  = tf.filter(t => t.concluido).length
    const pct   = total > 0 ? Math.round((conc / total) * 100) : 0
    return { total, pct }
  }

  const alta  = statsPrioridade("alta")
  const media = statsPrioridade("media")
  const baixa = statsPrioridade("baixa")

  const aFazer      = tarefas.filter(t => !t.concluido && !isAtrasada(t)).length
  const emAndamento = tarefas.filter(t => !t.concluido && isAtrasada(t) === false && isProximo(t)).length
  const concluidas  = tarefas.filter(t => t.concluido).length

  // ── calendário ───────────────────────────────────────────────────────
  const diasComTarefa = tarefas.reduce((acc, t) => {
    if (!t.dia_prazo) return acc
    const d = new Date(t.dia_prazo).toISOString().split("T")[0]
    acc[d] = true
    return acc
  }, {})

  function tileContent({ date, view }) {
    if (view !== "month") return null
    const d = date.toISOString().split("T")[0]
    if (!diasComTarefa[d]) return null
    return <span className="dashCalDot" />
  }

  // ── atividade recente ────────────────────────────────────────────────
  const recentes = [...tarefas].slice(0, 7)

  function tempoRelativo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000)
    if (diff < 60)   return `${diff} min atrás`
    if (diff < 1440) return `${Math.floor(diff / 60)} hrs atrás`
    return `${Math.floor(diff / 1440)} dias atrás`
  }

  if (carregando) return <div className="dashLoading">Carregando dashboard...</div>

  const iniciais = (usuarioObj?.nome || "?")
    .split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()

  const CARDS = [
    {
      label: "TAREFAS PENDENTES", valor: pendentes,
      sub: `${aFazer} a fazer`, icon: faListCheck,
      cor: "neutro",
    },
    {
      label: "TAREFAS ATRASADAS", valor: atrasadas,
      sub: atrasadas > 0 ? "Atenção imediata" : "Tudo em dia",
      subCor: atrasadas > 0 ? "#E24B4A" : undefined,
      icon: faTriangleExclamation, cor: "vermelho",
    },
    {
      label: "CONCLUÍDAS NA SEMANA", valor: concluidasSemana,
      sub: "Esta semana", icon: faCircleCheck, cor: "verde",
    },
    {
      label: "PRÓXIMOS PRAZOS", valor: proximosPrazos,
      sub: `Próximos ${DIAS_PROXIMO_PRAZO} dias`, icon: faClock, cor: "azul",
    },
  ]

  return (
    <div className="dashFunc">
      {/* Saudação */}
      <p className="dashSaudacao">
        Bom dia, <strong>{nome}</strong> — você tem{" "}
        <strong className="dashDestAtraso">{atrasadas} atrasada(s)</strong> e{" "}
        <strong className="dashDestInfo">{proximosPrazos} prazo(s) chegando</strong>{" "}
        nos próximos {DIAS_PROXIMO_PRAZO} dias.
      </p>

      {/* Cards topo */}
      <div className="dashCards dashCards--4">
        {CARDS.map(c => (
          <div key={c.label} className={`dashCard dashCard--${c.cor}`}>
            <div className="dashCardTopo">
              <div>
                <small>{c.label}</small>
                <h3>{c.valor}</h3>
              </div>
              <span className={`dashCardBadge dashCardBadge--${c.cor}`}>
                <FontAwesomeIcon icon={c.icon} />
              </span>
            </div>
            <p style={c.subCor ? { color: c.subCor, fontWeight: 600 } : {}}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Linha baixo — grid 3 colunas, visão geral se ajusta ao conteúdo */}
      <div className="dashBaixo">

        {/* Visão geral — menor, alinha pelo topo */}
        <div className="dashBaixoCard dashVisaoGeral">
          <h2>Visão Geral</h2>

          {[
            { label: "Alta Prioridade",  stats: alta,  cor: "#E24B4A" },
            { label: "Média Prioridade", stats: media, cor: "#EF9F27" },
            { label: "Baixa Prioridade", stats: baixa, cor: "#1D9E75" },
          ].map(({ label, stats, cor }) => (
            <div key={label} className="dashPrioridadeItem">
              <div className="dashPrioridadeNomePct">
                <span>{label}</span>
                <span style={{ color: cor, fontWeight: 600 }}>{stats.total}</span>
              </div>
              <progress
                className="dashProgress"
                value={stats.total}
                max={tarefas.length || 1}
                style={{ "--bar-cor": cor }}
              />
            </div>
          ))}

          <div className="dashStatusRow">
            <div className="dashStatusChip">
              <span className="dashChipDot" style={{ background: "#3647ff" }} />
              A Fazer <strong>{aFazer}</strong>
            </div>
            <div className="dashStatusChip">
              <span className="dashChipDot" style={{ background: "#EF9F27" }} />
              Andamento <strong>{tarefas.filter(t => !t.concluido).length - atrasadas}</strong>
            </div>
            <div className="dashStatusChip">
              <span className="dashChipDot" style={{ background: "#1D9E75" }} />
              Concluído <strong>{concluidas}</strong>
            </div>
          </div>
        </div>

        {/* Mini calendário */}
        <div className="dashBaixoCard dashCalCard">
          <Calendar
            onChange={setDataCal}
            value={dataCal}
            tileContent={tileContent}
            className="dashCal"
            locale="pt-BR"
          />
          {(() => {
            const diaStr    = dataCal.toISOString().split("T")[0]
            const tarefasDia = tarefas.filter(t =>
              t.dia_prazo &&
              new Date(t.dia_prazo).toISOString().split("T")[0] === diaStr
            )
            if (tarefasDia.length === 0)
              return <div className="dashCalEvento dashCalEventoVazio">Sem tarefas neste dia</div>
            return tarefasDia.map(t => (
              <div key={t.id} className="dashCalEvento">
                <span className="dashCalEventoBarra" />
                <div>
                  <p className="dashCalEventoTitulo">{t.titulo}</p>
                  <p className="dashCalEventoSub">Todo o dia · Prazo</p>
                </div>
              </div>
            ))
          })()}
        </div>

        {/* Atividade recente */}
        <div className="dashBaixoCard dashAtividade">
          <h2>Atividade Recente</h2>
          {recentes.length === 0 && <p className="dashVazio">Nenhuma atividade</p>}
          <ul className="dashAtividadeLista">
            {recentes.map(t => (
              <li key={t.id} className="dashAtividadeItem">
                <div className="dashAtividadeAvatar">{iniciais}</div>
                <div className="dashAtividadeTexto">
                  <p>
                    <strong>{nome}</strong>{" "}
                    {t.concluido ? "concluiu" : "recebeu"} a tarefa{" "}
                    <strong>{t.titulo}</strong>
                  </p>
                  <small>{tempoRelativo(t.dia_criado)}</small>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default DashboardFuncionario