import { useEffect, useState } from "react"
import { supabase } from "../services/supabase"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faArrowLeft, faListCheck, faCircleCheck, faClock,
  faTriangleExclamation, faChevronDown, faChevronUp,
  faFile, faDownload, faCheck, faXmark, faCloudArrowUp,
  faEnvelope, faPhone, faIdCard, faFolderOpen,
} from "@fortawesome/free-solid-svg-icons"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts"
import "../styles/Equipe.css"
import { useNavigate } from "react-router-dom"

const DIAS_PROXIMO = 5

function FuncionarioDetalhe({ funcionario, tarefas, projetos, escopo, idEmpresa, isDono = false, onVoltar }) {
  const [aba, setAba]               = useState("tarefas")
  const [subtarefas, setSubtarefas] = useState([])
  const [arquivos, setArquivos]     = useState([])
  const [abasAbertas, setAbasAbertas] = useState({})
  const [uploadTarefaId, setUploadTarefaId] = useState(null)
  const [uploading, setUploading]   = useState(false)
  const [toastMsg, setToastMsg]     = useState("")
  const [toastOn, setToastOn]       = useState(false)

  const iniciais = funcionario.nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
  const usuario = JSON.parse(localStorage.getItem("usuario"))

  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const proxLimit = new Date(hoje); proxLimit.setDate(hoje.getDate() + DIAS_PROXIMO)

  // ── Carregar subtarefas e arquivos ───────────────────────────────────
  useEffect(() => {
    async function carregar() {
      if (tarefas.length === 0) return
      const ids = tarefas.map(t => t.id)

      const { data: sub } = await supabase.from("subtarefas").select("*").in("id_tarefa", ids)
      setSubtarefas(sub || [])

      const { data: arq } = await supabase
        .from("arquivos")
        .select("*")
        .eq("cpf_funcionario", funcionario.cpf)
        .order("data_upload", { ascending: false })
      setArquivos(arq || [])
    }
    carregar()
  }, [funcionario.cpf, tarefas])

  async function showToast(msg) {
    setToastMsg(msg); setToastOn(true)
    await new Promise(r => setTimeout(r, 2500))
    setToastOn(false)
  }

  // ── Helpers status ────────────────────────────────────────────────────
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

  function getStatusLabel(t) {
    const subs = subtarefas.filter(s => s.id_tarefa === t.id)
    const conc = subs.filter(s => s.concluida).length
    if (t.concluido) return "Feito"
    if (isAtrasada(t)) return "Atrasada"
    if (subs.length > 0 && conc > 0) return "Em progresso"
    return "À fazer"
  }

  function getStatusClass(t) {
    const s = getStatusLabel(t)
    if (s === "Feito")        return "badgeStatus--concluida"
    if (s === "Atrasada")     return "badgeStatus--atrasada"
    if (s === "Em progresso") return "badgeStatus--em_progresso"
    return "badgeStatus--pendente"
  }

  // ── Stats ─────────────────────────────────────────────────────────────
  const total      = tarefas.length
  const concluidas = tarefas.filter(t => t.concluido).length
  const proximas   = tarefas.filter(isProximo).length
  const atrasadas  = tarefas.filter(isAtrasada).length
  const progresso  = total > 0 ? Math.round((concluidas / total) * 100) : 0
  const navigate = useNavigate

  useEffect(() => {
    if(!usuario){navigate("/dashboard")}
  }, [navigate]) 

  // ── Dados gráficos ────────────────────────────────────────────────────
  const porPrioridade = ["alta", "media", "baixa"].map(p => ({
    prioridade: p === "alta" ? "Alta" : p === "media" ? "Média" : "Baixa",
    quantidade: tarefas.filter(t => t.prioridade === p).length,
    cor: p === "alta" ? "#E24B4A" : p === "media" ? "#EF9F27" : "#1D9E75",
  }))

  const porStatus = [
    { name: "Próximas",   value: proximas,  color: "#EF9F27" },
    { name: "Concluídas", value: concluidas, color: "#1D9E75" },
    { name: "Atrasadas",  value: atrasadas,  color: "#E24B4A" },
  ].filter(d => d.value > 0)

  // ── Upload ────────────────────────────────────────────────────────────
  async function handleUpload(e, tarefaId) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)

    const caminho = `${funcionario.cpf}/${tarefaId}/${Date.now()}_${file.name}`
    const { error: upErr } = await supabase.storage.from("arquivos").upload(caminho, file)
    if (upErr) { showToast("Erro no upload: " + upErr.message); setUploading(false); return }

    const tamanhoFmt = file.size > 1024 * 1024
      ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`

    const { data: novo, error: dbErr } = await supabase.from("arquivos").insert([{
      nome_arquivo: file.name,
      tamanho: tamanhoFmt,
      tipo: file.name.split(".").pop().toUpperCase(),
      caminho,
      cpf_funcionario: funcionario.cpf,
      id_tarefa: tarefaId,
      status: "pendente",
      data_upload: new Date().toISOString(),
      ...(escopo === "startup" ? { startup_id: idEmpresa } : { empresa_id: idEmpresa }),
    }]).select().single()

    if (dbErr) showToast("Erro ao salvar: " + dbErr.message)
    else { setArquivos(prev => [novo, ...prev]); showToast("Arquivo enviado!") }

    setUploading(false)
    setUploadTarefaId(null)
  }

  async function atualizarStatusArquivo(id, status) {
    await supabase.from("arquivos").update({ status }).eq("id", id)
    setArquivos(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  async function baixarArquivo(arq) {
    const { data } = await supabase.storage.from("arquivos").download(arq.caminho)
    if (!data) return
    const url = URL.createObjectURL(data)
    const a = document.createElement("a")
    a.href = url; a.download = arq.nome_arquivo; a.click()
    URL.revokeObjectURL(url)
  }

  function formatarData(d) {
    if (!d) return ""
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  const prioLabel = { alta: "Alta", media: "Média", baixa: "Baixa" }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="detalhePage">

      {/* Toast */}
      <div className={`detalheToast ${toastOn ? "ativo" : ""}`}><h3>{toastMsg}</h3></div>

      {/* Voltar */}
      <button className="detalhVoltar" onClick={onVoltar}>
        <FontAwesomeIcon icon={faArrowLeft} /> Voltar
      </button>

      {/* Card do funcionário */}
      <div className="detalheFuncCard">
        <div className="detalheFuncTopo">
          <div className="detalheAvatarWrap">
            <div className="detalheAvatar">{iniciais}</div>
            <span className="detalheOnlineDot" />
          </div>
          <div>
            <div className="detalheNomeLinha">
              <h2>{funcionario.nome}</h2>
              <span className="detalheOnlineBadge">● Online</span>
            </div>
            <p className="detalheCargo">{funcionario.cargo || "Colaborador"}</p>
            <p className="detalheEmail">
              <FontAwesomeIcon icon={faFile} style={{ fontSize: 11 }} /> {funcionario.email}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="detalheStatsGrid">
          <div className="detalheStatCard detalheStatCard--neutro">
            <FontAwesomeIcon icon={faListCheck} className="detalheStatIcone" />
            <strong>{total}</strong><span>Total</span>
          </div>
          <div className="detalheStatCard detalheStatCard--verde">
            <FontAwesomeIcon icon={faCircleCheck} className="detalheStatIcone" />
            <strong>{concluidas}</strong><span>Concluídas</span>
          </div>
          <div className="detalheStatCard detalheStatCard--amarelo">
            <FontAwesomeIcon icon={faClock} className="detalheStatIcone" />
            <strong>{proximas}</strong><span>Perto do prazo</span>
          </div>
          <div className="detalheStatCard detalheStatCard--vermelho">
            <FontAwesomeIcon icon={faTriangleExclamation} className="detalheStatIcone" />
            <strong>{atrasadas}</strong><span>Atrasadas</span>
          </div>
        </div>

        {/* Progresso */}
        <div className="detalheProgressoWrap">
          <div className="detalheProgressoTopo">
            <span>Progresso geral</span>
            <strong>{progresso}%</strong>
          </div>
          <progress className="detalheProgressoBar" value={progresso} max={100} />
        </div>
      </div>

      {/* Abas */}
      <div className="detalheAbas">
        {[
          { id: "tarefas",   label: `Tarefas (${total})` },
          { id: "arquivos",  label: `Arquivos (${arquivos.length})` },
          { id: "relatorio", label: "Relatório" },
          { id: "perfil",    label: "Perfil" },
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

      {/* ── ABA TAREFAS ── */}
      {aba === "tarefas" && (
        <div className="detalheConteudo">
          {tarefas.length === 0 && <p className="detalheVazio">Nenhuma tarefa atribuída</p>}
          {tarefas.map(t => {
            const subs = subtarefas.filter(s => s.id_tarefa === t.id)
            const conc = subs.filter(s => s.concluida).length
            const aberta = abasAbertas[t.id]

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
                    <span className={`badgePrioridade badge-${t.prioridade}`}>{prioLabel[t.prioridade]}</span>
                    <span className={`badgeStatus ${getStatusClass(t)}`}>{getStatusLabel(t)}</span>
                    {subs.length > 0 && <span className="progressoTarefa">{conc}/{subs.length}</span>}
                    <button className="botaoToggle" onClick={() =>
                      setAbasAbertas(prev => ({ ...prev, [t.id]: !prev[t.id] }))
                    }>
                      <FontAwesomeIcon icon={aberta ? faChevronUp : faChevronDown} />
                    </button>
                  </div>
                </div>

                {aberta && (
                  <div className="detalheTarefaExpand">
                    {subs.length > 0 && (
                      <>
                        <p className="detalheSubLabel">Sub-tarefas ({conc}/{subs.length})</p>
                        <ul className="detalheSubLista">
                          {subs.map(s => (
                            <li key={s.id_subtarefa} className={s.concluida ? "subtarefaTextoRiscado" : ""}>
                              {s.nome_subtarefa}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                    <div className="detalheUploadArea">
                      <label className="detalheUploadBotao" htmlFor={`upload-${t.id}`}>
                        <FontAwesomeIcon icon={faCloudArrowUp} />
                        {uploading && uploadTarefaId === t.id ? "Enviando..." : "Enviar arquivo"}
                        <input
                          id={`upload-${t.id}`}
                          type="file"
                          style={{ display: "none" }}
                          disabled={uploading}
                          onChange={e => { setUploadTarefaId(t.id); handleUpload(e, t.id) }}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── ABA ARQUIVOS ── */}
      {aba === "arquivos" && (
        <div className="detalheConteudo">
          {arquivos.length === 0 && <p className="detalheVazio">Nenhum arquivo enviado ainda</p>}
          {arquivos.map(arq => (
            <div key={arq.id} className="detalheArquivoItem">
              <div className="detalheArquivoEsq">
                <div className="detalheArquivoIconeWrap">
                  <FontAwesomeIcon icon={faFile} />
                </div>
                <div>
                  <p className="detalheArquivoNome">{arq.nome_arquivo}</p>
                  <p className="detalheArquivoMeta">
                    {arq.tipo} · {arq.tamanho} · {formatarData(arq.data_upload)}
                  </p>
                </div>
              </div>
              <div className="detalheArquivoDir">
                <span className={`detalheArqBadge detalheArqBadge--${arq.status}`}>
                  {arq.status === "aprovado" ? "✓ Aprovado"
                    : arq.status === "rejeitado" ? "✗ Rejeitado"
                    : "⏳ Aguardando"}
                </span>
                {isDono && arq.status === "pendente" && (
                  <>
                    <button className="detalheArqBotao detalheArqBotao--ok" title="Aprovar"
                      onClick={() => atualizarStatusArquivo(arq.id, "aprovado")}>
                      <FontAwesomeIcon icon={faCheck} />
                    </button>
                    <button className="detalheArqBotao detalheArqBotao--nao" title="Rejeitar"
                      onClick={() => atualizarStatusArquivo(arq.id, "rejeitado")}>
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </>
                )}
                <button className="detalheArqBotao detalheArqBotao--dl" title="Baixar"
                  onClick={() => baixarArquivo(arq)}>
                  <FontAwesomeIcon icon={faDownload} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ABA RELATÓRIO ── */}
      {aba === "relatorio" && (
        <div className="detalheConteudo">
          <div className="detalheRelCard">
            <h3>Índice de performance</h3>
            <div className="detalheRelStats">
              {[
                { label: "Taxa de conclusão", valor: `${progresso}%` },
                { label: "Histórico total",   valor: total },
                { label: "Taxa de atraso",    valor: `${total > 0 ? Math.round((atrasadas / total) * 100) : 0}%` },
                { label: "Tarefas ativas",    valor: tarefas.filter(t => !t.concluido).length },
              ].map(s => (
                <div key={s.label} className="detalheRelStatItem">
                  <strong>{s.valor}</strong>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="detalheRelGraficos">
            <div className="detalheRelCard detalheRelCard--meio">
              <h3>Por prioridade</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={porPrioridade} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="prioridade" tick={{ fontSize: 12 }} width={50} />
                  <Tooltip />
                  <Bar dataKey="quantidade" radius={[0, 6, 6, 0]}>
                    {porPrioridade.map((e, i) => <Cell key={i} fill={e.cor} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="detalheRelCard detalheRelCard--meio">
              <h3>Por status</h3>
              {porStatus.length === 0 ? (
                <p className="detalheVazio">Sem dados</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={porStatus} cx="50%" cy="50%"
                      innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}
                      label={({ percent }) => `${Math.round(percent * 100)}%`} labelLine={false}>
                      {porStatus.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {projetos.length > 0 && (
            <div className="detalheRelCard">
              <h3>Projetos ativos</h3>
              <div className="detalheProjetosTags">
                {projetos.map(p => (
                  <span key={p.id_projeto} className="equipeTag">{p.nome_projeto}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ABA PERFIL ── */}
      {aba === "perfil" && (
        <div className="detalheConteudo">
          {/* Informações básicas */}
          <div className="detalheRelCard">
            <h3>Informações</h3>
            <div className="detalhePerfilGrid">
              <div className="detalhePerfilItem">
                <FontAwesomeIcon icon={faIdCard} className="detalhePerfilIcone" />
                <div>
                  <span className="detalhePerfilLabel">Nome completo</span>
                  <p className="detalhePerfilValor">{funcionario.nome}</p>
                </div>
              </div>
              <div className="detalhePerfilItem">
                <FontAwesomeIcon icon={faEnvelope} className="detalhePerfilIcone" />
                <div>
                  <span className="detalhePerfilLabel">E-mail</span>
                  <p className="detalhePerfilValor">{funcionario.email || "—"}</p>
                </div>
              </div>
              <div className="detalhePerfilItem">
                <FontAwesomeIcon icon={faPhone} className="detalhePerfilIcone" />
                <div>
                  <span className="detalhePerfilLabel">Telefone</span>
                  <p className="detalhePerfilValor">{funcionario.telefone || "—"}</p>
                </div>
              </div>
              <div className="detalhePerfilItem">
                <FontAwesomeIcon icon={faIdCard} className="detalhePerfilIcone" />
                <div>
                  <span className="detalhePerfilLabel">CPF</span>
                  <p className="detalhePerfilValor">{funcionario.cpf}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Projetos */}
          {projetos.length > 0 && (
            <div className="detalheRelCard">
              <h3>Projetos</h3>
              <div className="detalheProjetosTags">
                {projetos.map(p => (
                  <span key={p.id_projeto} className="equipeTag">{p.nome_projeto}</span>
                ))}
              </div>
            </div>
          )}

          {/* Resumo de tarefas sem os cards repetidos — só a barra */}
          <div className="detalheRelCard">
            <h3>Progresso ({progresso}%)</h3>
            <p className="detalhePerfilProgressoSub">
              {concluidas} de {total} tarefas concluídas
              {atrasadas > 0 && ` · ${atrasadas} atrasada(s)`}
            </p>
            <progress
              className="detalheProgressoBar"
              value={progresso}
              max={100}
              style={{ marginTop: 10 }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default FuncionarioDetalhe