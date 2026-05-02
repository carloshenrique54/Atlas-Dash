import { useEffect, useState } from "react"
import { supabase } from "../services/supabase"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faListCheck,
  faCircleCheck,
  faClock,
  faArrowTrendUp,
  faTriangleExclamation,
  faUsers,
} from "@fortawesome/free-solid-svg-icons"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts"

function DashboardDono({ usuarioObj }) {
  const CPF      = usuarioObj?.cpf ?? ""
  const idEmpresa = parseInt(usuarioObj?.empresa_id)   // garante int para o Supabase
  const nome     = usuarioObj?.nome?.split(" ")[0] ?? "Dono"

  const [escopo, setEscopo]         = useState(null)
  const [tarefas, setTarefas]       = useState([])
  const [funcionarios, setFuncionarios] = useState([])
  const [projetos, setProjetos]     = useState([])
  const [carregando, setCarregando] = useState(true)

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  // ── detectar escopo ──────────────────────────────────────────────────
  useEffect(() => {
    async function detectar() {
      if (!idEmpresa || isNaN(idEmpresa)) return
      const { data: s } = await supabase.from("startups").select("id").eq("id", idEmpresa).maybeSingle()
      if (s) { setEscopo("startup"); return }
      const { data: e } = await supabase.from("empresas").select("id").eq("id", idEmpresa).maybeSingle()
      if (e) setEscopo("empresa")
    }
    detectar()
  }, [idEmpresa])

  // ── carregar dados ───────────────────────────────────────────────────
  useEffect(() => {
    if (!idEmpresa || !escopo) return
    async function carregar() {
      setCarregando(true)

      // tarefas — usa campo booleano `concluido`
      let tq = supabase.from("tarefas").select("id, titulo, cpf_responsavel, prioridade, dia_prazo, dia_criado, concluido, id_projeto")
      tq = escopo === "startup" ? tq.eq("id_startup", idEmpresa) : tq.eq("id_empresa", idEmpresa)
      const { data: t } = await tq
      setTarefas(t || [])

      // funcionários — parseInt garante tipo correto para int8
      let fq = supabase.from("funcionarios").select("nome, cpf")
      fq = escopo === "startup"
        ? fq.eq("startup_id", idEmpresa)
        : fq.eq("empresa_id", idEmpresa)
      const { data: f, error: ef } = await fq
      if (ef) console.error("Erro ao buscar funcionários:", ef)
      setFuncionarios(f || [])

      // projetos
      let pq = supabase.from("projetos").select("id_projeto, nome_projeto")
      pq = escopo === "startup" ? pq.eq("startup_id", idEmpresa) : pq.eq("empresa_id", idEmpresa)
      const { data: p } = await pq
      setProjetos(p || [])

      setCarregando(false)
    }
    carregar()
  }, [idEmpresa, escopo])

  // ── helpers ──────────────────────────────────────────────────────────
  function isAtrasada(t) {
    if (t.concluido) return false
    if (!t.dia_prazo) return false
    const prazo = new Date(t.dia_prazo)
    prazo.setHours(0, 0, 0, 0)
    return prazo < hoje
  }

  function progressoProjeto(projeto) {
    const tp = tarefas.filter(t => t.id_projeto === projeto.id_projeto)
    if (tp.length === 0) return 0
    const conc = tp.filter(t => t.concluido).length
    return Math.round((conc / tp.length) * 100)
  }

  // ── stats topo ───────────────────────────────────────────────────────
  const totalTarefas = tarefas.length
  const concluidas   = tarefas.filter(t => t.concluido).length
  const pendentes    = tarefas.filter(t => !t.concluido).length
  const atrasadas    = tarefas.filter(isAtrasada).length
  const emAndamento  = totalTarefas - concluidas - atrasadas - (pendentes - atrasadas)
  const membros      = funcionarios.length
  const progGeral    = totalTarefas > 0 ? Math.round((concluidas / totalTarefas) * 100) : 0

  // ── gráfico: atribuídas x atrasadas por colaborador ─────────────────
  const chartData = funcionarios.map(f => {
    const tf = tarefas.filter(t => t.cpf_responsavel === f.cpf)
    return {
      nome:       f.nome.split(" ")[0],
      Atribuídas: tf.length,
      Atrasadas:  tf.filter(isAtrasada).length,
      Concluídas: tf.filter(t => t.concluido).length,
    }
  })

  // ── lista de colaboradores ───────────────────────────────────────────
  const listaFuncionarios = funcionarios.map(f => {
    const tf       = tarefas.filter(t => t.cpf_responsavel === f.cpf)
    const total    = tf.length
    const feitas   = tf.filter(t => t.concluido).length
    const atraso   = tf.filter(isAtrasada).length
    const progresso = total > 0 ? Math.round((feitas / total) * 100) : 0
    return { ...f, total, feitas, atraso, progresso }
  })

  if (carregando) return <div className="dashLoading">Carregando dashboard...</div>

  const CARDS = [
    { label: "Total Tarefas", valor: totalTarefas, icon: faListCheck,          cor: "neutro"   },
    { label: "Concluídas",    valor: concluidas,   icon: faCircleCheck,         cor: "verde"    },
    { label: "Pendentes",     valor: pendentes,    icon: faClock,               cor: "amarelo"  },
    { label: "Em Andamento",  valor: emAndamento,  icon: faArrowTrendUp,        cor: "neutro"   },
    { label: "Atrasadas",     valor: atrasadas,    icon: faTriangleExclamation, cor: "vermelho" },
    { label: "Membros",       valor: membros,      icon: faUsers,               cor: "neutro"   },
  ]

  return (
    <div className="dashDono">
      {/* Saudação */}
      <p className="dashSaudacao">
        Bom dia, <strong>{nome}</strong> — sua empresa tem{" "}
        <strong className="dashDestAtraso">{atrasadas} atrasada(s)</strong> e{" "}
        <strong className="dashDestInfo">{membros} membro(s)</strong> ativos.
      </p>

      {/* Cards topo */}
      <div className="dashCards">
        {CARDS.map(c => (
          <div key={c.label} className={`dashCard dashCard--${c.cor}`}>
            <span className={`dashCardIcone dashCardIcone--${c.cor}`}>
              <FontAwesomeIcon icon={c.icon} />
            </span>
            <h3>{c.valor}</h3>
            <p>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Progresso geral */}
      <div className="dashProgresso">
        <div className="dashProgressoTopo">
          <span>Progresso Geral da Equipe</span>
          <span className="dashProgressoPct">{progGeral}%</span>
        </div>
        <div className="dashProgressoBar">
          <div className="dashProgressoFill" style={{ width: `${progGeral}%` }} />
        </div>
      </div>

      {/* Meio: gráfico + projetos */}
      <div className="dashMeio">
        <div className="dashGraficoCard">
          <h2>Performance por Colaborador</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8edf3" vertical={false} />
              <XAxis dataKey="nome" tick={{ fontSize: 12, fontFamily: "Inter" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fontFamily: "Inter" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, fontFamily: "Inter", fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: "Inter" }} />
              <Bar dataKey="Atribuídas" fill="#3647ff" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Concluídas" fill="#1D9E75" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Atrasadas"  fill="#E24B4A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="dashProjetosCard">
          <h2>Projetos Ativos</h2>
          <div className="dashProjetosList">
            {projetos.length === 0 && <p className="dashVazio">Nenhum projeto</p>}
            {projetos.map(p => {
              const pct = progressoProjeto(p)
              return (
                <div key={p.id_projeto} className="dashProjetoItem">
                  <div className="dashProjetoNomePct">
                    <span>{p.nome_projeto}</span>
                    <span className="dashProjetoPct">{pct}%</span>
                  </div>
                  <div className="dashProjetoBar">
                    <div className="dashProjetoFill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Lista de colaboradores — sem filtro */}
      <div className="dashFuncLista">
        {listaFuncionarios.length === 0 && (
          <p className="dashVazio">Nenhum colaborador encontrado</p>
        )}
        {listaFuncionarios.map(f => {
          const iniciais = f.nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
          return (
            <div key={f.cpf} className="dashFuncCard">
              <div className="dashFuncEsq">
                <div className="dashFuncAvatar">{iniciais}</div>
                <div>
                  <p className="dashFuncNome">
                    {f.nome}
                    <span className="dashFuncOnline" />
                  </p>
                  <p className="dashFuncCargo">Colaborador</p>
                </div>
              </div>
              <div className="dashFuncDir">
                <div className="dashFuncStats">
                  <span>{f.total}<br /><small>Total</small></span>
                  <span className="dashFuncFeitas">{f.feitas}<br /><small>Feitas</small></span>
                  {f.atraso > 0 && (
                    <span className="dashFuncAtraso">{f.atraso}<br /><small>Atraso</small></span>
                  )}
                </div>
                <div className="dashFuncBarWrap">
                  <div className="dashFuncBar">
                    <div className="dashFuncBarFill" style={{ width: `${f.progresso}%` }} />
                  </div>
                  <span className="dashFuncPct">{f.progresso}%</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default DashboardDono