import { useEffect, useState } from "react"
import { supabase } from "../services/supabase"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faPen, faPlus, faCheck, faXmark, faCamera,
  faEnvelope, faPhone, faLocationDot, faCalendarDays,
  faBriefcase, faGraduationCap, faBuilding, faLink,
  faUsers, faListCheck, faFolderOpen, faArrowTrendUp,
} from "@fortawesome/free-solid-svg-icons"
import {
  faGithub, faLinkedin,
} from "@fortawesome/free-brands-svg-icons"
import "../styles/Perfil.css"
import { useNavigate } from "react-router-dom"

// ── helpers ──────────────────────────────────────────────────────────
function Chip({ label, onRemove }) {
  return (
    <span className="perfilChip">
      {label}
      {onRemove && (
        <button className="perfilChipRemove" onClick={onRemove} type="button">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      )}
    </span>
  )
}

function EditableField({ label, value, onChange, multiline = false }) {
  const [edit, setEdit] = useState(false)
  const [local, setLocal] = useState(value || "")

  useEffect(() => { setLocal(value || "") }, [value])

  function salvar() { onChange(local); setEdit(false) }

  return (
    <div className="perfilEditableField">
      {edit ? (
        <div className="perfilEditableRow">
          {multiline
            ? <textarea value={local} onChange={e => setLocal(e.target.value)} rows={3} className="perfilInput" />
            : <input value={local} onChange={e => setLocal(e.target.value)} className="perfilInput" />
          }
          <button className="perfilIconBtn perfilIconBtn--ok" onClick={salvar}><FontAwesomeIcon icon={faCheck} /></button>
          <button className="perfilIconBtn perfilIconBtn--no" onClick={() => { setLocal(value||""); setEdit(false) }}><FontAwesomeIcon icon={faXmark} /></button>
        </div>
      ) : (
        <div className="perfilEditableRow">
          <span className={local ? "" : "perfilPlaceholder"}>{local || `Adicionar ${label.toLowerCase()}...`}</span>
          <button className="perfilIconBtn" onClick={() => setEdit(true)}><FontAwesomeIcon icon={faPen} /></button>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
function Perfil() {
  const usuario    = localStorage.getItem("usuario")
  const usuarioObj = usuario ? JSON.parse(usuario) : null
  const CPF        = usuarioObj?.cpf ?? ""
  const idEmpresa  = parseInt(usuarioObj?.empresa_id)
  const isFuncionario = usuarioObj?.cargo === "funcionario"

  const [escopo, setEscopo]         = useState(null)
  const [perfil, setPerfil]         = useState(null)
  const [funcionario, setFuncionario] = useState(null)
  const [empresa, setEmpresa]       = useState(null)
  const [projetos, setProjetos]     = useState([])
  const [tarefas, setTarefas]       = useState([])
  const [funcionarios, setFuncionarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const navigate = useNavigate

  useEffect(() => {
    if(!usuario){navigate("/dashboard")}
  }, [navigate]) 

  // Edição de habilidades
  const [novaHabilidade, setNovaHabilidade] = useState("")
  const [editandoHab, setEditandoHab]       = useState(false)

  // Edição de experiência
  const [modalExp, setModalExp] = useState(false)
  const [expForm, setExpForm]   = useState({ cargo:"", empresa:"", inicio:"", fim:"", tipo:"trabalho" })

  // ── Detectar escopo ────────────────────────────────────────────────
  useEffect(() => {
    async function detectar() {
      if (!idEmpresa || isNaN(idEmpresa)) return
      const { data: s } = await supabase.from("startups").select("*").eq("id", idEmpresa).maybeSingle()
      if (s) { setEscopo("startup"); setEmpresa(s); return }
      const { data: e } = await supabase.from("empresas").select("*").eq("id", idEmpresa).maybeSingle()
      if (e) { setEscopo("empresa"); setEmpresa(e) }
    }
    detectar()
  }, [idEmpresa])

  // ── Carregar dados ─────────────────────────────────────────────────
  useEffect(() => {
    if (!idEmpresa || !escopo) return
    async function carregar() {
      setCarregando(true)

      // Dados do funcionário / usuário logado
      if (isFuncionario) {
        const { data: f } = await supabase.from("funcionarios").select("*").eq("cpf", CPF).maybeSingle()
        setFuncionario(f)
      }

      // Perfil estendido
      const { data: p } = await supabase.from("perfis").select("*").eq("cpf", CPF).maybeSingle()
      setPerfil(p || { cpf: CPF, bio:"", habilidades:[], experiencias:[], linkedin:"", github:"", portfolio:"", cidade:"", data_entrada:"" })

      // Projetos
      let pq = supabase.from("projetos").select("id_projeto, nome_projeto, descricao_projeto, prazo_projeto")
      pq = escopo === "startup" ? pq.eq("startup_id", idEmpresa) : pq.eq("empresa_id", idEmpresa)
      const { data: projs } = await pq
      setProjetos(projs || [])

      // Tarefas
      let tq = supabase.from("tarefas").select("id, concluido, id_projeto")
      tq = escopo === "startup" ? tq.eq("id_startup", idEmpresa) : tq.eq("id_empresa", idEmpresa)
      const { data: ts } = await tq
      setTarefas(ts || [])

      // Funcionários (para dono)
      if (!isFuncionario) {
        let fq = supabase.from("funcionarios").select("nome, cpf, email")
        fq = escopo === "startup" ? fq.eq("startup_id", idEmpresa) : fq.eq("empresa_id", idEmpresa)
        const { data: fs } = await fq
        setFuncionarios(fs || [])
      }

      setCarregando(false)
    }
    carregar()
  }, [idEmpresa, escopo, CPF, isFuncionario])

  // ── Persistir perfil ────────────────────────────────────────────────
  async function salvarPerfil(campo, valor) {
    const novo = { ...perfil, [campo]: valor }
    setPerfil(novo)
    await supabase.from("perfis").upsert({ ...novo, cpf: CPF }, { onConflict: "cpf" })
  }

  // ── Habilidades ─────────────────────────────────────────────────────
  function addHabilidade() {
    if (!novaHabilidade.trim()) return
    const habs = [...(perfil?.habilidades || []), novaHabilidade.trim()]
    salvarPerfil("habilidades", habs)
    setNovaHabilidade("")
  }

  function removeHabilidade(i) {
    const habs = (perfil?.habilidades || []).filter((_, idx) => idx !== i)
    salvarPerfil("habilidades", habs)
  }

  // ── Experiências ────────────────────────────────────────────────────
  function addExperiencia() {
    if (!expForm.cargo || !expForm.empresa) return
    const exps = [...(perfil?.experiencias || []), expForm]
    salvarPerfil("experiencias", exps)
    setExpForm({ cargo:"", empresa:"", inicio:"", fim:"", tipo:"trabalho" })
    setModalExp(false)
  }

  function removeExperiencia(i) {
    const exps = (perfil?.experiencias || []).filter((_, idx) => idx !== i)
    salvarPerfil("experiencias", exps)
  }

  // ── Progresso de projeto ────────────────────────────────────────────
  function progressoProjeto(idProjeto) {
    const tp = tarefas.filter(t => t.id_projeto === idProjeto)
    if (!tp.length) return 0
    return Math.round((tp.filter(t => t.concluido).length / tp.length) * 100)
  }

  // ── Participações do funcionário ────────────────────────────────────
  function meusProjetosFunc() {
    return projetos // Na visão do funcionário, mostra todos da empresa por ora
  }

  if (carregando) return <div className="perfilLoading">Carregando perfil...</div>

  const habilidades   = perfil?.habilidades   || []
  const experiencias  = perfil?.experiencias  || []
  const nome          = isFuncionario ? (funcionario?.nome || usuarioObj?.nome) : (empresa?.nome || "")
  const email         = isFuncionario ? (funcionario?.email || "") : (empresa?.dono_email || "")
  const telefone      = isFuncionario ? (funcionario?.telefone || "") : ""
  const iniciais      = nome.split(" ").slice(0,2).map(n=>n[0]||"").join("").toUpperCase()

  // ══════════════════════════════════════════════════════
  // VISÃO DO FUNCIONÁRIO
  // ══════════════════════════════════════════════════════
  if (isFuncionario) {
    return (
      <div className="perfilPage">

        {/* Modal adicionar experiência */}
        {modalExp && (
          <div className="perfilOverlay" onClick={e => { if (e.target === e.currentTarget) setModalExp(false) }}>
            <div className="perfilModal">
              <div className="perfilModalHeader">
                <h3>Adicionar Experiência</h3>
                <button className="perfilIconBtn perfilIconBtn--no" onClick={() => setModalExp(false)}>
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
              <div className="perfilModalCorpo">
                <label>Tipo</label>
                <div className="perfilTipoRow">
                  {["trabalho","educacao"].map(t => (
                    <button
                      key={t}
                      className={`perfilTipoBotao ${expForm.tipo===t ? "ativo":""}`}
                      onClick={() => setExpForm(p => ({...p, tipo:t}))}
                    >
                      <FontAwesomeIcon icon={t==="trabalho" ? faBriefcase : faGraduationCap} />
                      {t==="trabalho" ? "Trabalho" : "Educação"}
                    </button>
                  ))}
                </div>
                <label>{expForm.tipo==="trabalho" ? "Cargo" : "Curso / Grau"}</label>
                <input className="perfilInput" value={expForm.cargo} onChange={e => setExpForm(p=>({...p,cargo:e.target.value}))} placeholder={expForm.tipo==="trabalho" ? "Ex: Gerente de Projetos" : "Ex: Bacharelado em TI"} />
                <label>{expForm.tipo==="trabalho" ? "Empresa" : "Instituição"}</label>
                <input className="perfilInput" value={expForm.empresa} onChange={e => setExpForm(p=>({...p,empresa:e.target.value}))} placeholder={expForm.tipo==="trabalho" ? "Ex: Atlas Corp" : "Ex: USP"} />
                <div className="perfilModalLinha">
                  <div>
                    <label>Início</label>
                    <input className="perfilInput" value={expForm.inicio} onChange={e => setExpForm(p=>({...p,inicio:e.target.value}))} placeholder="Ex: 2021" />
                  </div>
                  <div>
                    <label>Fim</label>
                    <input className="perfilInput" value={expForm.fim} onChange={e => setExpForm(p=>({...p,fim:e.target.value}))} placeholder="Presente" />
                  </div>
                </div>
                <button className="perfilSalvarBtn" onClick={addExperiencia}>Adicionar</button>
              </div>
            </div>
          </div>
        )}

        <div className="perfilLayout">
          {/* ── Sidebar esquerda ── */}
          <div className="perfilSidebar">

            {/* Card principal */}
            <div className="perfilSideCard">
              <div className="perfilBanner">
                <div className="perfilAvatarBig">{iniciais}</div>
              </div>
              <div className="perfilSideInfo">
                <div className="perfilNomeLinha">
                  <h2>{nome}</h2>
                </div>
                <p className="perfilCargo">{funcionario?.cargo || "Colaborador"}</p>
                <p className="perfilBio">
                  <EditableField
                    label="Bio"
                    value={perfil?.bio}
                    onChange={v => salvarPerfil("bio", v)}
                    multiline
                  />
                </p>
                <div className="perfilMetaLista">
                  <span className="perfilMetaItem">
                    <FontAwesomeIcon icon={faBuilding} /> {empresa?.areaatuacao || empresa?.nome || "—"}
                  </span>
                  <span className="perfilMetaItem">
                    <FontAwesomeIcon icon={faLocationDot} />
                    <EditableField label="Cidade" value={perfil?.cidade} onChange={v => salvarPerfil("cidade", v)} />
                  </span>
                  <span className="perfilMetaItem">
                    <FontAwesomeIcon icon={faCalendarDays} />
                    <EditableField label="Data de entrada" value={perfil?.data_entrada} onChange={v => salvarPerfil("data_entrada", v)} />
                  </span>
                </div>
              </div>
            </div>

            {/* Links sociais */}
            <div className="perfilSideCard">
              <h4 className="perfilSideTitulo">Links Sociais</h4>
              {[
                { label:"GITHUB",    icon:faGithub,   campo:"github",    placeholder:"github.com/usuario" },
                { label:"LINKEDIN",  icon:faLinkedin, campo:"linkedin",  placeholder:"linkedin.com/in/usuario" },
                { label:"PORTFOLIO", icon:faLink,     campo:"portfolio", placeholder:"meuportfolio.com" },
              ].map(l => (
                <div key={l.campo} className="perfilLinkItem">
                  <div className="perfilLinkIcone">
                    <FontAwesomeIcon icon={l.icon} />
                  </div>
                  <div className="perfilLinkConteudo">
                    <span className="perfilLinkLabel">{l.label}</span>
                    <EditableField
                      label={l.label}
                      value={perfil?.[l.campo]}
                      onChange={v => salvarPerfil(l.campo, v)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Conteúdo principal ── */}
          <div className="perfilMain">

            {/* Contato */}
            <div className="perfilCard">
              <h3 className="perfilCardTitulo">Informações de Contato</h3>
              <div className="perfilContatoGrid">
                <div className="perfilContatoItem">
                  <div className="perfilContatoIconeWrap"><FontAwesomeIcon icon={faEnvelope} /></div>
                  <div>
                    <span className="perfilContatoLabel">EMAIL</span>
                    <p className="perfilContatoValor">{email || "—"}</p>
                  </div>
                </div>
                <div className="perfilContatoItem">
                  <div className="perfilContatoIconeWrap"><FontAwesomeIcon icon={faPhone} /></div>
                  <div>
                    <span className="perfilContatoLabel">TELEFONE</span>
                    <p className="perfilContatoValor">{telefone || "—"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Habilidades */}
            <div className="perfilCard">
              <div className="perfilCardHeader">
                <h3 className="perfilCardTitulo">Habilidades</h3>
                <button className="perfilTextBtn" onClick={() => setEditandoHab(v => !v)}>
                  {editandoHab ? "Feito" : "Editar"}
                </button>
              </div>
              <div className="perfilChipsArea">
                {habilidades.map((h, i) => (
                  <Chip key={i} label={h} onRemove={editandoHab ? () => removeHabilidade(i) : null} />
                ))}
                {editandoHab && (
                  <div className="perfilAddChip">
                    <input
                      className="perfilInput perfilInput--sm"
                      value={novaHabilidade}
                      onChange={e => setNovaHabilidade(e.target.value)}
                      placeholder="Nova habilidade"
                      onKeyDown={e => { if (e.key==="Enter") addHabilidade() }}
                    />
                    <button className="perfilIconBtn perfilIconBtn--ok" onClick={addHabilidade}>
                      <FontAwesomeIcon icon={faPlus} />
                    </button>
                  </div>
                )}
                {!editandoHab && (
                  <button className="perfilChipAdd" onClick={() => setEditandoHab(true)}>
                    <FontAwesomeIcon icon={faPlus} /> Adicionar
                  </button>
                )}
              </div>
            </div>

            {/* Experiência */}
            <div className="perfilCard">
              <div className="perfilCardHeader">
                <h3 className="perfilCardTitulo">Experiência</h3>
                <button className="perfilTextBtn" onClick={() => setModalExp(true)}>
                  Adicionar
                </button>
              </div>
              {experiencias.length === 0 && (
                <p className="perfilVazio">Nenhuma experiência adicionada ainda</p>
              )}
              {experiencias.map((exp, i) => (
                <div key={i} className="perfilExpItem">
                  <div className="perfilExpIcone">
                    <FontAwesomeIcon icon={exp.tipo==="educacao" ? faGraduationCap : faBriefcase} />
                  </div>
                  <div className="perfilExpInfo">
                    <p className="perfilExpCargo">{exp.cargo}</p>
                    <p className="perfilExpEmpresa">{exp.empresa}</p>
                    <p className="perfilExpPeriodo">{exp.inicio}{exp.fim ? ` - ${exp.fim}` : " - Presente"}</p>
                  </div>
                  <button className="perfilIconBtn perfilIconBtn--no" onClick={() => removeExperiencia(i)}>
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </div>
              ))}
            </div>

            {/* Projetos */}
            <div className="perfilCard">
              <div className="perfilCardHeader">
                <h3 className="perfilCardTitulo">Projetos</h3>
                <span className="perfilTextBtn">{projetos.length} projetos</span>
              </div>
              {projetos.length === 0 && <p className="perfilVazio">Nenhum projeto vinculado</p>}
              {projetos.map(p => {
                const pct = progressoProjeto(p.id_projeto)
                const ativo = pct < 100
                return (
                  <div key={p.id_projeto} className="perfilProjetoItem">
                    <div className="perfilProjetoIcone">
                      <FontAwesomeIcon icon={faFolderOpen} />
                    </div>
                    <div className="perfilProjetoInfo">
                      <div className="perfilProjetoNomeLinha">
                        <p className="perfilProjetoNome">{p.nome_projeto}</p>
                        <span className={`perfilProjetoStatus ${ativo ? "perfilProjetoStatus--ativo" : "perfilProjetoStatus--conc"}`}>
                          {ativo ? "Ativo" : "Concluído"}
                        </span>
                      </div>
                      {p.descricao_projeto && (
                        <p className="perfilProjetoDesc">{p.descricao_projeto}</p>
                      )}
                      <div className="perfilProjetoBarWrap">
                        <progress className="perfilProjetoBar" value={pct} max={100} />
                        <span className="perfilProjetoPct">{pct}%</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════
  // VISÃO DO DONO
  // ══════════════════════════════════════════════════════
  const totalTarefas  = tarefas.length
  const concluidas    = tarefas.filter(t => t.concluido).length
  const taxaConc      = totalTarefas > 0 ? Math.round((concluidas/totalTarefas)*100) : 0

  return (
    <div className="perfilPage">
      <div className="perfilLayout">
        {/* ── Sidebar ── */}
        <div className="perfilSidebar">
          <div className="perfilSideCard">
            <div className="perfilBanner perfilBanner--empresa" />
            <div className="perfilSideInfo">
              <div className="perfilAvatarEmpresa">{iniciais}</div>
              <h2 className="perfilEmpresaNome">{nome}</h2>
              <p className="perfilCargo">{empresa?.areaatuacao || "Empresa"}</p>
              {empresa?.cnpj && (
                <p className="perfilCargo" style={{ fontSize:11 }}>CNPJ: {empresa.cnpj}</p>
              )}
              <div className="perfilMetaLista">
                <span className="perfilMetaItem">
                  <FontAwesomeIcon icon={faUsers} /> {funcionarios.length} colaboradores
                </span>
                <span className="perfilMetaItem">
                  <FontAwesomeIcon icon={faFolderOpen} /> {projetos.length} projetos
                </span>
              </div>
            </div>
          </div>

          {/* Contato da empresa */}
          <div className="perfilSideCard">
            <h4 className="perfilSideTitulo">Contato</h4>
            <div className="perfilMetaLista">
              <span className="perfilMetaItem"><FontAwesomeIcon icon={faEnvelope} /> {empresa?.dono_email || "—"}</span>
            </div>
          </div>
        </div>

        {/* ── Conteúdo principal ── */}
        <div className="perfilMain">

          {/* Stats da empresa */}
          <div className="perfilCard">
            <h3 className="perfilCardTitulo">Visão Geral da Empresa</h3>
            <div className="perfilEmpresaStats">
              {[
                { label:"Membros",        valor:funcionarios.length, icon:faUsers,          cor:"azul" },
                { label:"Projetos",       valor:projetos.length,     icon:faFolderOpen,      cor:"verde" },
                { label:"Tarefas",        valor:totalTarefas,        icon:faListCheck,       cor:"neutro" },
                { label:"Taxa Conclusão", valor:`${taxaConc}%`,      icon:faArrowTrendUp,    cor:"amarelo" },
              ].map(s => (
                <div key={s.label} className={`perfilStatCard perfilStatCard--${s.cor}`}>
                  <FontAwesomeIcon icon={s.icon} className="perfilStatIcone" />
                  <strong>{s.valor}</strong>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Lista de funcionários */}
          <div className="perfilCard">
            <h3 className="perfilCardTitulo">Equipe ({funcionarios.length})</h3>
            {funcionarios.length === 0 && <p className="perfilVazio">Nenhum membro ainda</p>}
            {funcionarios.map(f => {
              const inics = f.nome.split(" ").slice(0,2).map(n=>n[0]).join("").toUpperCase()
              const tf = tarefas.filter(t => t.cpf_responsavel === f.cpf)
              const conc = tf.filter(t => t.concluido).length
              return (
                <div key={f.cpf} className="perfilMembroItem">
                  <div className="perfilMembroAvatar">{inics}</div>
                  <div className="perfilMembroInfo">
                    <p className="perfilMembroNome">{f.nome}</p>
                    <p className="perfilMembroEmail">{f.email}</p>
                  </div>
                  <div className="perfilMembroStats">
                    <span>{conc}/{tf.length} tarefas</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Projetos da empresa */}
          <div className="perfilCard">
            <div className="perfilCardHeader">
              <h3 className="perfilCardTitulo">Projetos</h3>
              <span className="perfilTextBtn">{projetos.length} projetos</span>
            </div>
            {projetos.map(p => {
              const pct = progressoProjeto(p.id_projeto)
              return (
                <div key={p.id_projeto} className="perfilProjetoItem">
                  <div className="perfilProjetoIcone">
                    <FontAwesomeIcon icon={faFolderOpen} />
                  </div>
                  <div className="perfilProjetoInfo">
                    <div className="perfilProjetoNomeLinha">
                      <p className="perfilProjetoNome">{p.nome_projeto}</p>
                      <span className={`perfilProjetoStatus ${pct<100 ? "perfilProjetoStatus--ativo":"perfilProjetoStatus--conc"}`}>
                        {pct<100 ? "Ativo" : "Concluído"}
                      </span>
                    </div>
                    {p.descricao_projeto && <p className="perfilProjetoDesc">{p.descricao_projeto}</p>}
                    <div className="perfilProjetoBarWrap">
                      <progress className="perfilProjetoBar" value={pct} max={100} />
                      <span className="perfilProjetoPct">{pct}%</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Perfil