import { useEffect, useState } from "react"
import { supabase } from "../services/supabase"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faMagnifyingGlass,
  faFilter,
  faChevronDown,
  faCalendarDays,
  faUsers,
  faCircleXmark,
  faPlus,
  faXmark,
} from "@fortawesome/free-solid-svg-icons"
import "../styles/Projetos.css"

function Projetos() {
  const usuario    = localStorage.getItem("usuario")
  const usuarioObj = usuario ? JSON.parse(usuario) : null
  const CPF        = usuarioObj?.cpf ?? ""
  const idEmpresa  = parseInt(usuarioObj?.empresa_id)
  const isFuncionario = usuarioObj?.cargo === "funcionario"

  const delay = (ms) => new Promise((r) => setTimeout(r, ms))

  const [escopo, setEscopo]               = useState(null)
  const [projetos, setProjetos]           = useState([])
  const [tarefas, setTarefas]             = useState([])
  const [funcionarios, setFuncionarios]   = useState([])
  const [carregando, setCarregando]       = useState(true)

  // Filtros
  const [busca, setBusca]                 = useState("")
  const [filtroStatus, setFiltroStatus]   = useState("")

  // Form criar projeto
  const [abrirForm, setAbrirForm]         = useState(false)
  const [nomeProjeto, setNomeProjeto]     = useState("")
  const [descProjeto, setDescProjeto]     = useState("")
  const [prazoProjeto, setPrazoProjeto]   = useState("")
  const [tagInput, setTagInput]           = useState("")
  const [tags, setTags]                   = useState([])
  const [participantes, setParticipantes] = useState([]) // cpfs selecionados

  // Toast
  const [toastMsg, setToastMsg]   = useState("")
  const [toastTipo, setToastTipo] = useState("ok") // "ok" | "erro"
  const [toastOn, setToastOn]     = useState(false)

  async function showToast(msg, tipo = "ok") {
    setToastMsg(msg); setToastTipo(tipo); setToastOn(true)
    await delay(2500); setToastOn(false)
  }

  // ── Detectar escopo ──────────────────────────────────────────────────
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

  // ── Carregar tudo ────────────────────────────────────────────────────
  useEffect(() => {
    if (!idEmpresa || !escopo) return
    async function carregar() {
      setCarregando(true)

      // projetos
      let pq = supabase.from("projetos").select("*")
      pq = escopo === "startup" ? pq.eq("startup_id", idEmpresa) : pq.eq("empresa_id", idEmpresa)
      const { data: p } = await pq
      setProjetos(p || [])

      // tarefas (para calcular progresso)
      let tq = supabase.from("tarefas").select("id, id_projeto, concluido")
      tq = escopo === "startup" ? tq.eq("id_startup", idEmpresa) : tq.eq("id_empresa", idEmpresa)
      const { data: t } = await tq
      setTarefas(t || [])

      // funcionários
      let fq = supabase.from("funcionarios").select("nome, cpf")
      fq = escopo === "startup" ? fq.eq("startup_id", idEmpresa) : fq.eq("empresa_id", idEmpresa)
      const { data: f } = await fq
      setFuncionarios(f || [])

      setCarregando(false)
    }
    carregar()
  }, [idEmpresa, escopo])

  // ── Helpers ──────────────────────────────────────────────────────────
  function progresso(projeto) {
    const tp = tarefas.filter(t => t.id_projeto === projeto.id_projeto)
    if (!tp.length) return 0
    return Math.round((tp.filter(t => t.concluido).length / tp.length) * 100)
  }

  function numParticipantes(projeto) {
    const arr = projeto.cpf_participantes
    if (!arr) return 0
    if (Array.isArray(arr)) return arr.length
    // Supabase retorna _text como string "{cpf1,cpf2}"
    return arr.replace(/[{}]/g, "").split(",").filter(Boolean).length
  }

  function participantesArray(projeto) {
    const arr = projeto.cpf_participantes
    if (!arr) return []
    if (Array.isArray(arr)) return arr
    return arr.replace(/[{}]/g, "").split(",").filter(Boolean)
  }

  function statusProjeto(projeto) {
    const pct = progresso(projeto)
    if (pct >= 100) return "concluido"
    if (pct > 0)    return "ativo"
    const prazo = projeto.prazo_projeto ? new Date(projeto.prazo_projeto) : null
    if (prazo && prazo < new Date()) return "atrasado"
    return "ativo"
  }

  function formatarData(d) {
    if (!d) return null
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
  }

  function corProgresso(pct) {
    if (pct >= 100) return "#1D9E75"
    if (pct >= 60)  return "#3647ff"
    if (pct >= 30)  return "#EF9F27"
    return "#E24B4A"
  }

  // ── Projetos filtrados (funcionário vê só os seus) ───────────────────
  const projetosVisiveis = projetos.filter(p => {
    if (isFuncionario) {
      const parts = participantesArray(p)
      if (!parts.includes(CPF) && p.responsavel_cpf !== CPF) return false
    }
    if (busca && !p.nome_projeto.toLowerCase().includes(busca.toLowerCase())) return false
    if (filtroStatus && statusProjeto(p) !== filtroStatus) return false
    return true
  })

  // ── Criar projeto ────────────────────────────────────────────────────
  async function cadastrarProjeto(e) {
    e.preventDefault()
    if (!nomeProjeto.trim()) { showToast("Dê um nome ao projeto", "erro"); return }
    if (!prazoProjeto)       { showToast("Defina um prazo", "erro"); return }

    const cpfParticipantesArr = participantes.length > 0 ? participantes : null

    const payload = {
      nome_projeto:      nomeProjeto,
      descricao_projeto: descProjeto,
      responsavel_cpf:   CPF,
      prazo_projeto:     new Date(prazoProjeto + "T12:00:00").toISOString(),
      tags:              tags.length > 0 ? tags : null,
      cpf_participantes: cpfParticipantesArr,
      criado_projeto:    new Date().toISOString(),
    }

    if (escopo === "startup") payload.startup_id = idEmpresa
    else payload.empresa_id = idEmpresa

    const { error } = await supabase.from("projetos").insert([payload])

    if (error) { showToast("Erro ao criar projeto: " + error.message, "erro"); return }

    showToast("Projeto criado!")
    setAbrirForm(false)
    setNomeProjeto(""); setDescProjeto(""); setPrazoProjeto("")
    setTags([]); setParticipantes([])

    // Recarregar
    let pq = supabase.from("projetos").select("*")
    pq = escopo === "startup" ? pq.eq("startup_id", idEmpresa) : pq.eq("empresa_id", idEmpresa)
    const { data: p } = await pq
    setProjetos(p || [])
  }

  function adicionarTag() {
    const t = tagInput.trim()
    if (!t || tags.includes(t)) return
    setTags([...tags, t]); setTagInput("")
  }

  function toggleParticipante(cpf) {
    setParticipantes(prev =>
      prev.includes(cpf) ? prev.filter(c => c !== cpf) : [...prev, cpf]
    )
  }

  const STATUS_LABELS = { ativo: "Ativo", concluido: "Concluído", atrasado: "Atrasado" }

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="projetosPage">

      {/* Toast */}
      <div className={`projetosToast projetosToast--${toastTipo} ${toastOn ? "ativo" : ""}`}>
        {toastMsg}
      </div>

      {/* Barra topo */}
      <div className="projetosTopBar">
        <div className="projetosBusca">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="projetosBuscaIcone" />
          <input
            type="text"
            placeholder="Buscar projetos..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>

        <div className="projetosFiltroDir">
          <div className="projetosFiltroSelect">
            <FontAwesomeIcon icon={faFilter} className="projetosFiltroIcone" />
            <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
              <option value="">Todos os Status</option>
              <option value="ativo">Ativo</option>
              <option value="concluido">Concluído</option>
              <option value="atrasado">Atrasado</option>
            </select>
            <FontAwesomeIcon icon={faChevronDown} className="projetosChevron" />
          </div>

          {!isFuncionario && (
            <button className="projetosBotaoNovo" onClick={() => setAbrirForm(true)}>
              <FontAwesomeIcon icon={faPlus} /> Novo Projeto
            </button>
          )}
        </div>
      </div>

      {/* Formulário criar projeto */}
      {abrirForm && (
        <div className="projetosFormOverlay" onClick={(e) => { if (e.target === e.currentTarget) setAbrirForm(false) }}>
          <form className="projetosForm" onSubmit={cadastrarProjeto}>
            <div className="projetosFormHeader">
              <h2>Novo Projeto</h2>
              <button type="button" className="projetosFormFechar" onClick={() => setAbrirForm(false)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="projetosFormCorpo">
              {/* Coluna esquerda */}
              <div className="projetosFormCol">
                <label>Nome do projeto</label>
                <input
                  type="text"
                  value={nomeProjeto}
                  onChange={e => setNomeProjeto(e.target.value)}
                  placeholder="Ex: Campanha Verão 2026"
                />

                <label>Descrição</label>
                <textarea
                  value={descProjeto}
                  onChange={e => setDescProjeto(e.target.value)}
                  placeholder="Descreva o objetivo do projeto..."
                />

                <label>Prazo</label>
                <input
                  type="date"
                  value={prazoProjeto}
                  onChange={e => setPrazoProjeto(e.target.value)}
                />

                <label>Tags</label>
                <div className="projetosTagInput">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    placeholder="Digite e pressione Enter"
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); adicionarTag() } }}
                  />
                  <button type="button" onClick={adicionarTag}>
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="projetosTagsList">
                    {tags.map(t => (
                      <span key={t} className="projetoTagChip">
                        {t}
                        <button type="button" onClick={() => setTags(tags.filter(x => x !== t))}>
                          <FontAwesomeIcon icon={faCircleXmark} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Coluna direita: participantes */}
              <div className="projetosFormCol">
                <label>Participantes</label>
                <div className="projetosParticipantesList">
                  {funcionarios.length === 0 && (
                    <p className="projetosVazio">Nenhum funcionário cadastrado</p>
                  )}
                  {funcionarios.map(f => {
                    const selecionado = participantes.includes(f.cpf)
                    const iniciais = f.nome.split(" ").slice(0,2).map(n=>n[0]).join("").toUpperCase()
                    return (
                      <div
                        key={f.cpf}
                        className={`projetosParticipanteItem ${selecionado ? "selecionado" : ""}`}
                        onClick={() => toggleParticipante(f.cpf)}
                      >
                        <div className="projetosParticipanteAvatar">{iniciais}</div>
                        <span className="projetosParticipanteNome">{f.nome}</span>
                        <span className="projetosParticipanteCheck">{selecionado ? "✓" : ""}</span>
                      </div>
                    )
                  })}
                </div>

                <div className="projetosFormBotoes">
                  <button type="submit" className="projetosBotaoSalvar">Criar Projeto</button>
                  <button type="button" className="projetosBotaoCancelar" onClick={() => setAbrirForm(false)}>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Grid de projetos */}
      {carregando ? (
        <div className="projetosLoading">Carregando projetos...</div>
      ) : projetosVisiveis.length === 0 ? (
        <div className="projetosVazioEstado">
          <p>Nenhum projeto encontrado</p>
          {!isFuncionario && (
            <button className="projetosBotaoNovo" onClick={() => setAbrirForm(true)}>
              <FontAwesomeIcon icon={faPlus} /> Criar primeiro projeto
            </button>
          )}
        </div>
      ) : (
        <div className="projetosGrid">
          {projetosVisiveis.map(p => {
            const pct     = progresso(p)
            const status  = statusProjeto(p)
            const cor     = corProgresso(pct)
            const nPart   = numParticipantes(p)
            const tagsArr = Array.isArray(p.tags) ? p.tags : (p.tags ? Object.values(p.tags) : [])

            return (
              <div key={p.id_projeto} className="projetoCard">
                {/* Cabeçalho */}
                <div className="projetoCardTopo">
                  <div>
                    <h3 className="projetoNome">{p.nome_projeto}</h3>
                    {p.descricao_projeto && (
                      <p className="projetoDesc">{p.descricao_projeto}</p>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {tagsArr.length > 0 && (
                  <div className="projetoTags">
                    {tagsArr.slice(0,3).map((t, i) => (
                      <span key={i} className="projetoTagChip projetoTagChip--card">{t}</span>
                    ))}
                  </div>
                )}

                {/* Progresso */}
                <div className="projetoProgresso">
                  <div className="projetoProgressoTopo">
                    <span>Progresso</span>
                    <strong style={{ color: cor }}>{pct}%</strong>
                  </div>
                  <progress
                    className="projetoProgressoBar"
                    value={pct}
                    max={100}
                    style={{ "--proj-cor": cor }}
                  />
                </div>

                {/* Rodapé */}
                <div className="projetoCardRodape">
                  <div className="projetoCardRodapeEsq">
                    <span className={`projetoStatusBadge projetoStatus--${status}`}>
                      {STATUS_LABELS[status]}
                    </span>
                    <span className="projetoMeta">
                      <FontAwesomeIcon icon={faUsers} />
                      {nPart}
                    </span>
                  </div>
                  {p.prazo_projeto && (
                    <span className="projetoMeta">
                      <FontAwesomeIcon icon={faCalendarDays} />
                      {formatarData(p.prazo_projeto)}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Projetos