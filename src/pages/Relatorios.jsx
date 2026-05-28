import { useEffect, useState, useRef } from "react"
import { supabase } from "../services/supabase"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useNavigate } from "react-router-dom"
import {
  faListCheck, faCircleCheck, faClock, faTriangleExclamation,
  faChartLine, faCalendarDays, faFileArrowDown, faFire,
  faClipboardList, faArrowTrendUp, faArrowTrendDown,
  faUsers, faChartPie, faBuildingUser,
} from "@fortawesome/free-solid-svg-icons"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
  BarChart, Bar, Cell, PieChart, Pie, Legend,
} from "recharts"
import "../styles/Relatorios.css"

const DIAS_PROXIMO = 5

function Relatorios() {
  const usuario    = localStorage.getItem("usuario")
  const usuarioObj = usuario ? JSON.parse(usuario) : null
  const CPF        = usuarioObj?.cpf ?? ""
  const idEmpresa  = parseInt(usuarioObj?.empresa_id)
  const isFuncionario = usuarioObj?.cargo === "funcionario"
  const nome       = usuarioObj?.nome ?? ""

  const [escopo,      setEscopo]      = useState(null)
  const [tarefas,     setTarefas]     = useState([])
  const [funcionarios,setFuncionarios]= useState([])
  const [projetos,    setProjetos]    = useState([])
  const [subtarefas,  setSubtarefas]  = useState([])
  const [empresa,     setEmpresa]     = useState(null)
  const [carregando,  setCarregando]  = useState(true)
  const [periodoFiltro, setPeriodoFiltro] = useState("tudo")
  const [gerando,     setGerando]     = useState(false)
  const relRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => { if (!usuario) { navigate("/") } }, [navigate])

  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const proxLimit = new Date(hoje); proxLimit.setDate(hoje.getDate() + DIAS_PROXIMO)

  // ── Detectar escopo ──────────────────────────────────────────────────
  useEffect(() => {
    async function detectar() {
      if (!idEmpresa || isNaN(idEmpresa)) return
      const { data: s } = await supabase.from("startups").select("id, nome").eq("id", idEmpresa).maybeSingle()
      if (s) { setEscopo("startup"); setEmpresa(s); return }
      const { data: e } = await supabase.from("empresas").select("id, nome").eq("id", idEmpresa).maybeSingle()
      if (e) { setEscopo("empresa"); setEmpresa(e) }
    }
    detectar()
  }, [idEmpresa])

  // ── Carregar dados ───────────────────────────────────────────────────
  useEffect(() => {
    if (!idEmpresa || !escopo) return
    async function carregar() {
      setCarregando(true)

      let tq = supabase.from("tarefas").select("*")
      tq = escopo === "startup" ? tq.eq("id_startup", idEmpresa) : tq.eq("id_empresa", idEmpresa)
      const { data: t } = await tq
      setTarefas(t || [])

      let fq = supabase.from("funcionarios").select("nome, cpf")
      fq = escopo === "startup" ? fq.eq("startup_id", idEmpresa) : fq.eq("empresa_id", idEmpresa)
      const { data: f } = await fq
      setFuncionarios(f || [])

      let pq = supabase.from("projetos").select("id_projeto, nome_projeto, cpf_participantes")
      pq = escopo === "startup" ? pq.eq("startup_id", idEmpresa) : pq.eq("empresa_id", idEmpresa)
      const { data: p } = await pq
      setProjetos(p || [])

      if (t && t.length > 0) {
        const ids = t.map(x => x.id)
        const { data: sub } = await supabase.from("subtarefas").select("*").in("id_tarefa", ids)
        setSubtarefas(sub || [])
      }

      setCarregando(false)
    }
    carregar()
  }, [idEmpresa, escopo])

  // ── Helpers ──────────────────────────────────────────────────────────
  function isAtrasada(t) {
    if (t.concluido) return false
    if (!t.dia_prazo) return false
    const p = new Date(t.dia_prazo); p.setHours(0, 0, 0, 0)
    return p < hoje
  }

  function isProximo(t) {
    if (t.concluido || !t.dia_prazo) return false
    const p = new Date(t.dia_prazo); p.setHours(0, 0, 0, 0)
    return p >= hoje && p <= proxLimit
  }

  function diasRestantes(t) {
    if (!t.dia_prazo) return null
    const p = new Date(t.dia_prazo); p.setHours(0, 0, 0, 0)
    return Math.ceil((p - hoje) / 86400000)
  }

  function filtrarPorPeriodo(lista) {
    const agora = new Date()
    return lista.filter(t => {
      if (!t.dia_criado) return true
      const criado = new Date(t.dia_criado)
      if (periodoFiltro === "hoje")   return criado.toDateString() === agora.toDateString()
      if (periodoFiltro === "semana") { const ini = new Date(agora); ini.setDate(agora.getDate() - 7); return criado >= ini }
      if (periodoFiltro === "mes")    { const ini = new Date(agora); ini.setMonth(agora.getMonth() - 1); return criado >= ini }
      return true
    })
  }

  // ── Gerar PDF real com jsPDF ─────────────────────────────────────────
  async function exportarPDF() {
    setGerando(true)
    try {
      // Importação dinâmica para não afetar o carregamento inicial
      const { default: jsPDF } = await import("jspdf")
      const { default: autoTable } = await import("jspdf-autotable")

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
      const pW  = doc.internal.pageSize.getWidth()
      const hoje_fmt = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })

      // ── Cores ──
      const AZUL   = [17, 22, 80]
      const VERDE  = [29, 158, 117]
      const VERM   = [226, 75, 74]
      const AMAR   = [239, 159, 39]
      const CINZA  = [138, 151, 168]

      // ── Cabeçalho ──
      doc.setFillColor(...AZUL)
      doc.rect(0, 0, pW, 40, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(22)
      doc.setFont("helvetica", "bold")
      doc.text(isFuncionario ? "Meu Relatório de Desempenho" : "Relatório da Empresa", 15, 18)
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(empresa?.nome || "", 15, 26)
      doc.text(`Gerado em: ${hoje_fmt}`, 15, 33)
      doc.text(`Usuário: ${nome} · CPF: ${CPF}`, pW - 15, 33, { align: "right" })

      let y = 50

      if (isFuncionario) {
        // ── VISÃO DO FUNCIONÁRIO ──
        const minhasTarefas = filtrarPorPeriodo(tarefas.filter(t => t.cpf_responsavel === CPF))
        const total      = minhasTarefas.length
        const concluidas = minhasTarefas.filter(t => t.concluido).length
        const atrasadas  = minhasTarefas.filter(isAtrasada).length
        const pendentes  = minhasTarefas.filter(t => !t.concluido && !isAtrasada(t)).length
        const taxaConc   = total > 0 ? Math.round((concluidas / total) * 100) : 0

        // Resumo
        doc.setTextColor(...AZUL)
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("Resumo de Desempenho", 15, y); y += 8

        autoTable(doc, {
          startY: y,
          head: [["Métrica", "Valor"]],
          body: [
            ["Total de tarefas atribuídas", String(total)],
            ["Tarefas concluídas",          String(concluidas)],
            ["Tarefas pendentes",           String(pendentes)],
            ["Tarefas atrasadas",           String(atrasadas)],
            ["Taxa de conclusão",           `${taxaConc}%`],
          ],
          styles:        { fontStyle: "normal", fontSize: 10 },
          headStyles:    { fillColor: AZUL, textColor: [255,255,255], fontStyle: "bold" },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          columnStyles:  { 0: { fontStyle: "bold" }, 1: { halign: "center" } },
        })
        y = doc.lastAutoTable.finalY + 12

        // Minhas tarefas
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("Lista de Tarefas", 15, y); y += 4

        const tarefasRows = minhasTarefas.map(t => {
          const dias = diasRestantes(t)
          const status = t.concluido ? "Concluída" : isAtrasada(t) ? "Atrasada" : "Pendente"
          const prazo  = t.dia_prazo ? new Date(t.dia_prazo).toLocaleDateString("pt-BR") : "—"
          return [
            t.titulo || "—",
            t.prioridade === "alta" ? "Alta" : t.prioridade === "media" ? "Média" : "Baixa",
            status,
            prazo,
            dias !== null ? (dias <= 0 ? "Vencida" : `${dias}d`) : "—",
          ]
        })

        autoTable(doc, {
          startY: y,
          head: [["Tarefa", "Prioridade", "Status", "Prazo", "Restam"]],
          body: tarefasRows,
          styles:     { fontSize: 9 },
          headStyles: { fillColor: AZUL, textColor: [255,255,255] },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          didParseCell(data) {
            if (data.column.index === 2 && data.section === "body") {
              const v = data.cell.raw
              if (v === "Concluída") data.cell.styles.textColor = VERDE
              if (v === "Atrasada")  data.cell.styles.textColor = VERM
            }
          },
        })
      } else {
        // ── VISÃO DO DONO ──
        const total      = tarefas.length
        const concluidas = tarefas.filter(t => t.concluido).length
        const atrasadas  = tarefas.filter(isAtrasada).length
        const pendentes  = tarefas.filter(t => !t.concluido && !isAtrasada(t)).length
        const taxaConc   = total > 0 ? Math.round((concluidas / total) * 100) : 0

        // Resumo geral
        doc.setTextColor(...AZUL)
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("Resumo Geral da Empresa", 15, y); y += 8

        autoTable(doc, {
          startY: y,
          head: [["Métrica", "Valor"]],
          body: [
            ["Total de tarefas",    String(total)],
            ["Tarefas concluídas",  String(concluidas)],
            ["Tarefas pendentes",   String(pendentes)],
            ["Tarefas atrasadas",   String(atrasadas)],
            ["Taxa de conclusão",   `${taxaConc}%`],
            ["Total de membros",    String(funcionarios.length)],
            ["Total de projetos",   String(projetos.length)],
          ],
          styles:      { fontSize: 10 },
          headStyles:  { fillColor: AZUL, textColor: [255,255,255] },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          columnStyles:{ 0: { fontStyle: "bold" }, 1: { halign: "center" } },
        })
        y = doc.lastAutoTable.finalY + 12

        // Performance por colaborador
        if (funcionarios.length > 0) {
          doc.setFontSize(14)
          doc.setFont("helvetica", "bold")
          doc.text("Performance por Colaborador", 15, y); y += 4

          const perfRows = funcionarios.map(f => {
            const tf   = tarefas.filter(t => t.cpf_responsavel === f.cpf)
            const conc = tf.filter(t => t.concluido).length
            const atra = tf.filter(isAtrasada).length
            const taxa = tf.length > 0 ? `${Math.round((conc / tf.length) * 100)}%` : "—"
            return [f.nome, String(tf.length), String(conc), String(atra), taxa]
          })

          autoTable(doc, {
            startY: y,
            head: [["Colaborador", "Total", "Concluídas", "Atrasadas", "Taxa"]],
            body: perfRows,
            styles:     { fontSize: 9 },
            headStyles: { fillColor: AZUL, textColor: [255,255,255] },
            alternateRowStyles: { fillColor: [245, 247, 250] },
          })
          y = doc.lastAutoTable.finalY + 12
        }

        // Projetos
        if (projetos.length > 0) {
          if (y > 220) { doc.addPage(); y = 20 }

          doc.setFontSize(14)
          doc.setFont("helvetica", "bold")
          doc.text("Projetos", 15, y); y += 4

          const projRows = projetos.map(p => {
            const tp  = tarefas.filter(t => t.id_projeto === p.id_projeto)
            const conc= tp.filter(t => t.concluido).length
            const pct = tp.length > 0 ? `${Math.round((conc / tp.length) * 100)}%` : "—"
            const status = pct === "100%" ? "Concluído" : "Em andamento"
            return [p.nome_projeto, String(tp.length), String(conc), pct, status]
          })

          autoTable(doc, {
            startY: y,
            head: [["Projeto", "Tarefas", "Concluídas", "Progresso", "Status"]],
            body: projRows,
            styles:     { fontSize: 9 },
            headStyles: { fillColor: AZUL, textColor: [255,255,255] },
            alternateRowStyles: { fillColor: [245, 247, 250] },
          })
        }
      }

      // ── Rodapé em todas as páginas ──
      const totalPaginas = doc.internal.getNumberOfPages()
      for (let i = 1; i <= totalPaginas; i++) {
        doc.setPage(i)
        doc.setFillColor(245, 247, 250)
        doc.rect(0, 285, pW, 12, "F")
        doc.setTextColor(...CINZA)
        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        doc.text("Atlas Dashboard · Relatório gerado automaticamente", 15, 292)
        doc.text(`Página ${i} de ${totalPaginas}`, pW - 15, 292, { align: "right" })
      }

      const nomeArq = isFuncionario
        ? `relatorio_${nome.replace(/ /g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`
        : `relatorio_empresa_${new Date().toISOString().split("T")[0]}.pdf`

      doc.save(nomeArq)
    } catch (err) {
      console.error("Erro ao gerar PDF:", err)
      alert("Erro ao gerar PDF. Verifique se jsPDF está instalado:\nnpm install jspdf jspdf-autotable")
    }
    setGerando(false)
  }

  // ══════════════════════════════════════════════════════
  //  VISÃO DO FUNCIONÁRIO
  // ══════════════════════════════════════════════════════
  if (isFuncionario) {
    const minhasTarefas = tarefas.filter(t => t.cpf_responsavel === CPF)
    const filtradas     = filtrarPorPeriodo(minhasTarefas)
    const total      = filtradas.length
    const concluidas = filtradas.filter(t => t.concluido).length
    const pendentes  = filtradas.filter(t => !t.concluido && !isAtrasada(t)).length
    const atrasadas  = filtradas.filter(isAtrasada).length
    const taxaConc   = total > 0 ? Math.round((concluidas / total) * 100) : 0

    const tempoMedio = (() => {
      const concTs = filtradas.filter(t => t.concluido && t.dia_criado && t.dia_prazo)
      if (!concTs.length) return "—"
      const media = concTs.reduce((acc, t) => acc + Math.abs(new Date(t.dia_prazo) - new Date(t.dia_criado)) / 86400000, 0) / concTs.length
      return `${media.toFixed(1)}d`
    })()

    const graficoDados = (() => {
      const semanas = {}
      filtradas.forEach(t => {
        if (!t.dia_criado) return
        const d = new Date(t.dia_criado)
        const ini = new Date(d); ini.setDate(d.getDate() - d.getDay())
        const chave = ini.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
        semanas[chave] = (semanas[chave] || 0) + 1
      })
      return Object.entries(semanas).slice(-8).map(([semana, total]) => ({ semana, total }))
    })()

    const overdueData = (() => {
      const data = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(hoje); d.setDate(d.getDate() - i * 7)
        const label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
        const count = minhasTarefas.filter(t => { if (!t.dia_prazo) return false; const p = new Date(t.dia_prazo); return !t.concluido && Math.abs(p - d) / 86400000 <= 7 && p < d }).length
        data.push({ label, count })
      }
      return data
    })()

    const prioridades = filtradas.filter(t => !t.concluido).sort((a, b) => ({ alta: 0, media: 1, baixa: 2 }[a.prioridade] - ({ alta: 0, media: 1, baixa: 2 }[b.prioridade]))).slice(0, 5)
    const historico   = [...minhasTarefas].sort((a, b) => new Date(b.dia_criado) - new Date(a.dia_criado)).slice(0, 6)

    function tempoRelativo(d) {
      if (!d) return ""
      const diff = Math.floor((Date.now() - new Date(d)) / 60000)
      if (diff < 60)   return `${diff} min atrás`
      if (diff < 1440) return `${Math.floor(diff / 60)} hrs atrás`
      return `${Math.floor(diff / 1440)} dias atrás`
    }

    const iniciais = nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
    const prioCorMap   = { alta: "#E24B4A", media: "#EF9F27", baixa: "#1D9E75" }
    const prioLabelMap = { alta: "HIGH", media: "MEDIUM", baixa: "LOW" }

    return (
      <div className="relPage" ref={relRef}>
        <div className="relTopBar">
          <div>
            <p className="relSubtitulo">{usuarioObj?.cargo || "Colaborador"}</p>
            <h1 className="relTitulo"><FontAwesomeIcon icon={faChartPie} /> Meu Desempenho</h1>
          </div>
          <button className="relExportBtn" onClick={exportarPDF} disabled={gerando}>
            <FontAwesomeIcon icon={faFileArrowDown} /> {gerando ? "Gerando PDF..." : "Exportar PDF"}
          </button>
        </div>

        <div className="relPeriodos">
          {["hoje", "semana", "mes", "tudo"].map(p => (
            <button key={p} className={`relPeriodoBotao ${periodoFiltro === p ? "ativo" : ""}`} onClick={() => setPeriodoFiltro(p)}>
              {{ hoje: "Hoje", semana: "Semana", mes: "Mês", tudo: "Tudo" }[p]}
            </button>
          ))}
        </div>

        <div className="relCards">
          {[
            { label: "Atribuídas",  valor: total,         icon: faListCheck,           cor: "neutro" },
            { label: "Concluídas",  valor: concluidas,    icon: faCircleCheck,          cor: "verde" },
            { label: "Pendentes",   valor: pendentes,     icon: faClock,                cor: "amarelo" },
            { label: "Atrasadas",   valor: atrasadas,     icon: faTriangleExclamation,  cor: "vermelho" },
            { label: "Conclusão",   valor: `${taxaConc}%`,icon: faArrowTrendUp,         cor: "azul" },
            { label: "Tempo Médio", valor: tempoMedio,    icon: faCalendarDays,         cor: "neutro" },
          ].map(c => (
            <div key={c.label} className={`relCard relCard--${c.cor}`}>
              <span className={`relCardIcone relCardIcone--${c.cor}`}><FontAwesomeIcon icon={c.icon} /></span>
              <strong>{c.valor}</strong><span>{c.label}</span>
            </div>
          ))}
        </div>

        <div className="relProgressoWrap">
          <div className="relProgressoTopo"><span>Progresso geral</span><strong>{taxaConc}%</strong></div>
          <progress className="relProgressoBar" value={taxaConc} max={100} />
        </div>

        <div className="relMeio">
          <div className="relGraficoCard">
            <div className="relGraficoTopo">
              <div className="relGraficoTituloLinha">
                <FontAwesomeIcon icon={faChartLine} className="relGraficoIcone" /><h3>Produtividade por Período</h3>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={graficoDados} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradLine" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#111650" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#111650" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8edf3" />
                <XAxis dataKey="semana" tick={{ fontSize: 11, fontFamily: "Inter" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fontFamily: "Inter" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontFamily: "Inter", fontSize: 12 }} />
                <Area type="monotone" dataKey="total" stroke="#111650" strokeWidth={2.5} fill="url(#gradLine)" dot={{ fill: "#111650", r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="relComparacaoCard">
            <div className="relComparacaoTituloLinha"><FontAwesomeIcon icon={faArrowTrendUp} /><h3>Comparação</h3></div>
            <div className="relCompItem">
              <span className="relCompLabel">Taxa de conclusão</span>
              <div className="relCompValorLinha">
                <strong className="relCompValor">{taxaConc}%</strong>
                <span className="relCompDelta relCompDelta--down"><FontAwesomeIcon icon={faArrowTrendDown} /> {Math.max(0, 58 - taxaConc)}%</span>
              </div>
              <span className="relCompSub">vs. período anterior (58%)</span>
            </div>
            <div className="relCompDivider" />
            <div className="relCompItem">
              <span className="relCompLabel">Tarefas concluídas</span>
              <div className="relCompValorLinha"><strong className="relCompValor">{concluidas}</strong><span className="relCompSub" style={{ marginLeft: 6 }}>de {total}</span></div>
            </div>
            <div className="relCompDivider" />
            <div className="relCompItem">
              <span className="relCompLabel">Overdue trend</span>
              <div className="relOverdueChart">
                {overdueData.map((d, i) => (
                  <div key={i} className="relOverdueBar" title={`${d.label}: ${d.count}`}>
                    <div className="relOverdueFill" style={{ height: `${Math.max(4, d.count * 14)}px` }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="relBaixo">
          <div className="relPrioridadesCard">
            <div className="relCardTituloLinha"><FontAwesomeIcon icon={faFire} className="relCardTituloIcone" /><h3>Minhas Prioridades</h3></div>
            {prioridades.length === 0 && <p className="relVazio">Nenhuma tarefa pendente</p>}
            {prioridades.map(t => {
              const dias = diasRestantes(t)
              return (
                <div key={t.id} className="relPrioItem">
                  <div className="relPrioEsq">
                    <span className="relPrioBadge" style={{ background: prioCorMap[t.prioridade] + "22", color: prioCorMap[t.prioridade] }}>{prioLabelMap[t.prioridade]}</span>
                    <div><p className="relPrioTitulo">{t.titulo}</p><p className="relPrioSub">{t.descricao?.slice(0, 40)}</p></div>
                  </div>
                  {dias !== null && <span className={`relPrioDias ${dias <= 2 ? "relPrioDias--urgente" : ""}`}>{dias <= 0 ? "Vencida" : `${dias}d restantes`}</span>}
                </div>
              )
            })}
          </div>

          <div className="relHistoricoCard">
            <div className="relCardTituloLinha"><FontAwesomeIcon icon={faClipboardList} className="relCardTituloIcone" /><h3>Histórico de Atividades</h3></div>
            {historico.map(t => (
              <div key={t.id} className="relHistItem">
                <div className="relHistAvatar">{iniciais}</div>
                <div className="relHistTexto">
                  <p>{t.concluido ? "concluiu" : "começou a trabalhar em"} <span className="relHistDestaque">{t.titulo}</span></p>
                  <small>{tempoRelativo(t.dia_criado)}</small>
                </div>
              </div>
            ))}
            {historico.length === 0 && <p className="relVazio">Sem atividades</p>}
          </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════
  //  VISÃO DO DONO
  // ══════════════════════════════════════════════════════
  const total      = tarefas.length
  const concluidas = tarefas.filter(t => t.concluido).length
  const atrasadas  = tarefas.filter(t => isAtrasada(t)).length
  const pendentes  = tarefas.filter(t => !t.concluido && !isAtrasada(t)).length
  const taxaConc   = total > 0 ? Math.round((concluidas / total) * 100) : 0
  const membros    = funcionarios.length

  const porFuncionario = funcionarios.map(f => {
    const tf = tarefas.filter(t => t.cpf_responsavel === f.cpf)
    return { nome: f.nome.split(" ")[0], Total: tf.length, Concluídas: tf.filter(t => t.concluido).length, Atrasadas: tf.filter(t => isAtrasada(t)).length }
  })

  const porPrioridade = [
    { name: "Alta",  value: tarefas.filter(t => t.prioridade === "alta").length,  color: "#E24B4A" },
    { name: "Média", value: tarefas.filter(t => t.prioridade === "media").length, color: "#EF9F27" },
    { name: "Baixa", value: tarefas.filter(t => t.prioridade === "baixa").length, color: "#1D9E75" },
  ].filter(d => d.value > 0)

  const progressoProjetos = projetos.map(p => {
    const tp  = tarefas.filter(t => t.id_projeto === p.id_projeto)
    const pct = tp.length > 0 ? Math.round((tp.filter(t => t.concluido).length / tp.length) * 100) : 0
    return { nome: p.nome_projeto, pct }
  })

  if (carregando) return <div className="relLoading">Carregando relatório...</div>

  return (
    <div className="relPage" ref={relRef}>
      <div className="relTopBar">
        <div>
          <h1 className="relTitulo"><FontAwesomeIcon icon={faBuildingUser} /> Relatório da Empresa</h1>
        </div>
        <button className="relExportBtn" onClick={exportarPDF} disabled={gerando}>
          <FontAwesomeIcon icon={faFileArrowDown} /> {gerando ? "Gerando PDF..." : "Exportar PDF"}
        </button>
      </div>

      <div className="relCards">
        {[
          { label: "Total Tarefas",  valor: total,         icon: faListCheck,          cor: "neutro" },
          { label: "Concluídas",     valor: concluidas,    icon: faCircleCheck,         cor: "verde" },
          { label: "Pendentes",      valor: pendentes,     icon: faClock,               cor: "amarelo" },
          { label: "Atrasadas",      valor: atrasadas,     icon: faTriangleExclamation, cor: "vermelho" },
          { label: "Taxa Conclusão", valor: `${taxaConc}%`,icon: faArrowTrendUp,        cor: "azul" },
          { label: "Membros",        valor: membros,       icon: faUsers,               cor: "neutro" },
        ].map(c => (
          <div key={c.label} className={`relCard relCard--${c.cor}`}>
            <span className={`relCardIcone relCardIcone--${c.cor}`}><FontAwesomeIcon icon={c.icon} /></span>
            <strong>{c.valor}</strong><span>{c.label}</span>
          </div>
        ))}
      </div>

      <div className="relProgressoWrap">
        <div className="relProgressoTopo"><span>Progresso geral da equipe</span><strong>{taxaConc}%</strong></div>
        <progress className="relProgressoBar" value={taxaConc} max={100} />
      </div>

      <div className="relMeio">
        <div className="relGraficoCard">
          <div className="relGraficoTituloLinha"><FontAwesomeIcon icon={faUsers} className="relGraficoIcone" /><h3>Performance por Colaborador</h3></div>
          {porFuncionario.length === 0 ? <p className="relVazio">Sem dados</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={porFuncionario} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8edf3" vertical={false} />
                <XAxis dataKey="nome" tick={{ fontSize: 12, fontFamily: "Inter" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fontFamily: "Inter" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontFamily: "Inter", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12, fontFamily: "Inter" }} />
                <Bar dataKey="Total" fill="#111650" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Concluídas" fill="#1D9E75" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Atrasadas" fill="#E24B4A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="relComparacaoCard">
          <div className="relComparacaoTituloLinha"><FontAwesomeIcon icon={faChartPie} /><h3>Por Prioridade</h3></div>
          {porPrioridade.length === 0 ? <p className="relVazio">Sem dados</p> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={porPrioridade} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3} label={({ percent }) => `${Math.round(percent * 100)}%`} labelLine={false}>
                  {porPrioridade.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {progressoProjetos.length > 0 && (
        <div className="relProjetosCard">
          <div className="relCardTituloLinha"><FontAwesomeIcon icon={faClipboardList} className="relCardTituloIcone" /><h3>Progresso dos Projetos</h3></div>
          <div className="relProjetosLista">
            {progressoProjetos.map((p, i) => (
              <div key={i} className="relProjetoItem">
                <div className="relProjetoNomePct">
                  <span>{p.nome}</span>
                  <strong style={{ color: p.pct >= 100 ? "#1D9E75" : p.pct >= 50 ? "#3647ff" : "#EF9F27" }}>{p.pct}%</strong>
                </div>
                <progress className="relProjetoBar" value={p.pct} max={100} style={{ "--proj-cor": p.pct >= 100 ? "#1D9E75" : p.pct >= 50 ? "#111650" : "#EF9F27" }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Relatorios