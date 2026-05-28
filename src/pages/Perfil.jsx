import { useEffect, useState, useRef } from "react"
import { supabase } from "../services/supabase"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faPen, faPlus, faCheck, faXmark, faCamera,
  faEnvelope, faPhone, faLocationDot, faCalendarDays,
  faBriefcase, faGraduationCap, faBuilding, faLink,
  faUsers, faListCheck, faFolderOpen, faArrowTrendUp,
  faIdCard,
} from "@fortawesome/free-solid-svg-icons"
import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons"
import "../styles/Perfil.css"

// ── Componente auxiliar: campo editável inline ────────────────────────
function EditableField({ label, value, onChange, multiline = false, type = "text" }) {
  const [edit,  setEdit]  = useState(false)
  const [local, setLocal] = useState(value || "")

  useEffect(() => { setLocal(value || "") }, [value])

  function salvar() { onChange(local); setEdit(false) }

  return (
    <div className="perfilEditableField">
      {edit ? (
        <div className="perfilEditableRow">
          {multiline
            ? <textarea value={local} onChange={e => setLocal(e.target.value)} rows={3} className="perfilInput" />
            : <input type={type} value={local} onChange={e => setLocal(e.target.value)} className="perfilInput" />
          }
          <button className="perfilIconBtn perfilIconBtn--ok" onClick={salvar}><FontAwesomeIcon icon={faCheck} /></button>
          <button className="perfilIconBtn perfilIconBtn--no" onClick={() => { setLocal(value || ""); setEdit(false) }}><FontAwesomeIcon icon={faXmark} /></button>
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

// ── Chip de habilidade ────────────────────────────────────────────────
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

// ══════════════════════════════════════════════════════════════════════
function Perfil() {
  const usuario       = localStorage.getItem("usuario")
  const usuarioObj    = usuario ? JSON.parse(usuario) : null
  const CPF           = usuarioObj?.cpf ?? ""
  const idEmpresa     = parseInt(usuarioObj?.empresa_id)
  const isFuncionario = usuarioObj?.cargo === "funcionario"

  const [escopo,       setEscopo]       = useState(null)
  const [perfil,       setPerfil]       = useState(null)
  const [funcionario,  setFuncionario]  = useState(null)  // dados do funcionario logado
  const [usuarioDono,  setUsuarioDono]  = useState(null)  // dados do dono (usuarios table)
  const [empresa,      setEmpresa]      = useState(null)  // dados da empresa/startup
  const [projetos,     setProjetos]     = useState([])
  const [tarefas,      setTarefas]      = useState([])
  const [funcionarios, setFuncionarios] = useState([])    // lista da equipe (para dono)
  const [carregando,   setCarregando]   = useState(true)

  // Avatar / foto
  const [fotoUrl,       setFotoUrl]       = useState(null)
  const [uploadandoFoto,setUploadandoFoto]= useState(false)
  const fotoInputRef = useRef(null)

  // Habilidades
  const [novaHabilidade, setNovaHabilidade] = useState("")
  const [editandoHab,    setEditandoHab]    = useState(false)

  // Modal de experiência (funcionário)
  const [modalExp, setModalExp] = useState(false)
  const [expForm,  setExpForm]  = useState({ cargo: "", empresa: "", inicio: "", fim: "", tipo: "trabalho" })

  // Toast
  const [toastMsg, setToastMsg] = useState("")
  const [toastOn,  setToastOn]  = useState(false)

  async function showToast(msg) {
    setToastMsg(msg); setToastOn(true)
    await new Promise(r => setTimeout(r, 2000))
    setToastOn(false)
  }

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

      if (isFuncionario) {
        // Dados pessoais do funcionário
        const { data: f } = await supabase.from("funcionarios").select("*").eq("cpf", CPF).maybeSingle()
        setFuncionario(f)
      } else {
        // Dados pessoais do dono (tabela usuarios)
        const { data: u } = await supabase.from("usuarios").select("nome, email, telefone, cpf").eq("cpf", CPF).maybeSingle()
        setUsuarioDono(u)
      }

      // Perfil estendido
      const { data: p } = await supabase.from("perfis").select("*").eq("cpf", CPF).maybeSingle()
      const perfilBase = p || { cpf: CPF, bio: "", habilidades: [], experiencias: [], linkedin: "", github: "", portfolio: "", cidade: "", data_entrada: "", foto_url: "" }
      setPerfil(perfilBase)
      setFotoUrl(perfilBase?.foto_url || null)

      // Projetos
      let pq = supabase.from("projetos").select("id_projeto, nome_projeto, descricao_projeto, prazo_projeto")
      pq = escopo === "startup" ? pq.eq("startup_id", idEmpresa) : pq.eq("empresa_id", idEmpresa)
      const { data: projs } = await pq
      setProjetos(projs || [])

      // Tarefas
      let tq = supabase.from("tarefas").select("id, concluido, id_projeto, cpf_responsavel")
      tq = escopo === "startup" ? tq.eq("id_startup", idEmpresa) : tq.eq("id_empresa", idEmpresa)
      const { data: ts } = await tq
      setTarefas(ts || [])

      // Equipe (apenas para dono)
      if (!isFuncionario) {
        let fq = supabase.from("funcionarios").select("nome, cpf, email, telefone")
        fq = escopo === "startup" ? fq.eq("startup_id", idEmpresa) : fq.eq("empresa_id", idEmpresa)
        const { data: fs } = await fq
        setFuncionarios(fs || [])
      }

      setCarregando(false)
    }
    carregar()
  }, [idEmpresa, escopo, CPF, isFuncionario])

  // ── Upload de foto de perfil ────────────────────────────────────────
  async function handleFotoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploadandoFoto(true)

    const extensao = file.name.split(".").pop()
    const caminho  = `${CPF}/avatar.${extensao}`

    // Remove foto antiga se existir
    await supabase.storage.from("avatars").remove([caminho])

    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(caminho, file, { upsert: true })

    if (upErr) { showToast("Erro ao enviar foto"); setUploadandoFoto(false); return }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(caminho)

    setFotoUrl(publicUrl)
    await salvarPerfil("foto_url", publicUrl)
    showToast("Foto atualizada!")
    setUploadandoFoto(false)
  }

  // ── Salvar campo no perfil ──────────────────────────────────────────
  async function salvarPerfil(campo, valor) {
    const novo = { ...perfil, [campo]: valor }
    setPerfil(novo)
    await supabase.from("perfis").upsert({ ...novo, cpf: CPF }, { onConflict: "cpf" })
  }

  // ── Salvar campo no funcionário (table funcionarios) ────────────────
  async function salvarFuncionario(campo, valor) {
    setFuncionario(prev => ({ ...prev, [campo]: valor }))
    await supabase.from("funcionarios").update({ [campo]: valor }).eq("cpf", CPF)
    showToast("Salvo!")
  }

  // ── Salvar campo do usuário dono (table usuarios) ───────────────────
  async function salvarUsuarioDono(campo, valor) {
    setUsuarioDono(prev => ({ ...prev, [campo]: valor }))
    await supabase.from("usuarios").update({ [campo]: valor }).eq("cpf", CPF)
    showToast("Salvo!")
  }

  // ── Salvar campo da empresa/startup ────────────────────────────────
  async function salvarEmpresa(campo, valor) {
    setEmpresa(prev => ({ ...prev, [campo]: valor }))
    const tabela = escopo === "startup" ? "startups" : "empresas"
    await supabase.from(tabela).update({ [campo]: valor }).eq("id", idEmpresa)
    showToast("Salvo!")
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

  // ── Experiências (funcionário) ──────────────────────────────────────
  function addExperiencia() {
    if (!expForm.cargo || !expForm.empresa) return
    const exps = [...(perfil?.experiencias || []), expForm]
    salvarPerfil("experiencias", exps)
    setExpForm({ cargo: "", empresa: "", inicio: "", fim: "", tipo: "trabalho" })
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

  if (carregando) return <div className="perfilLoading">Carregando perfil...</div>

  const habilidades  = perfil?.habilidades  || []
  const experiencias = perfil?.experiencias || []

  // Avatar: foto ou iniciais
  const nomeExibido = isFuncionario
    ? (funcionario?.nome || usuarioObj?.nome || "")
    : (empresa?.nome || "")
  const iniciais = nomeExibido.split(" ").slice(0, 2).map(n => n[0] || "").join("").toUpperCase()

  // ══════════════════════════════════════════════════════
  // VISÃO DO FUNCIONÁRIO
  // ══════════════════════════════════════════════════════
  if (isFuncionario) {
    return (
      <div className="perfilPage">
        {/* Toast */}
        <div className={`perfilToast ${toastOn ? "ativo" : ""}`}>{toastMsg}</div>

        {/* Modal experiência */}
        {modalExp && (
          <div className="perfilOverlay" onClick={e => { if (e.target === e.currentTarget) setModalExp(false) }}>
            <div className="perfilModal">
              <div className="perfilModalHeader">
                <h3>Adicionar Experiência</h3>
                <button className="perfilIconBtn perfilIconBtn--no" onClick={() => setModalExp(false)}><FontAwesomeIcon icon={faXmark} /></button>
              </div>
              <div className="perfilModalCorpo">
                <label>Tipo</label>
                <div className="perfilTipoRow">
                  {["trabalho", "educacao"].map(t => (
                    <button key={t} className={`perfilTipoBotao ${expForm.tipo === t ? "ativo" : ""}`} onClick={() => setExpForm(p => ({ ...p, tipo: t }))}>
                      <FontAwesomeIcon icon={t === "trabalho" ? faBriefcase : faGraduationCap} />
                      {t === "trabalho" ? "Trabalho" : "Educação"}
                    </button>
                  ))}
                </div>
                <label>{expForm.tipo === "trabalho" ? "Cargo" : "Curso / Grau"}</label>
                <input className="perfilInput" value={expForm.cargo} onChange={e => setExpForm(p => ({ ...p, cargo: e.target.value }))} placeholder={expForm.tipo === "trabalho" ? "Ex: Gerente de Projetos" : "Ex: Bacharelado em TI"} />
                <label>{expForm.tipo === "trabalho" ? "Empresa" : "Instituição"}</label>
                <input className="perfilInput" value={expForm.empresa} onChange={e => setExpForm(p => ({ ...p, empresa: e.target.value }))} placeholder={expForm.tipo === "trabalho" ? "Ex: Atlas Corp" : "Ex: USP"} />
                <div className="perfilModalLinha">
                  <div><label>Início</label><input className="perfilInput" value={expForm.inicio} onChange={e => setExpForm(p => ({ ...p, inicio: e.target.value }))} placeholder="Ex: 2021" /></div>
                  <div><label>Fim</label><input className="perfilInput" value={expForm.fim} onChange={e => setExpForm(p => ({ ...p, fim: e.target.value }))} placeholder="Presente" /></div>
                </div>
                <button className="perfilSalvarBtn" onClick={addExperiencia}>Adicionar</button>
              </div>
            </div>
          </div>
        )}

        <div className="perfilLayout">
          {/* ── Sidebar ── */}
          <div className="perfilSidebar">
            <div className="perfilSideCard">
              <div className="perfilBanner">
                {/* Avatar com upload */}
                <div className="perfilAvatarUploadWrap">
                  {fotoUrl
                    ? <img src={fotoUrl} alt="foto" className="perfilAvatarBigImg" />
                    : <div className="perfilAvatarBig">{iniciais}</div>
                  }
                  <button
                    className="perfilAvatarUploadBtn"
                    onClick={() => fotoInputRef.current?.click()}
                    title="Alterar foto"
                    disabled={uploadandoFoto}
                  >
                    <FontAwesomeIcon icon={faCamera} />
                  </button>
                  <input ref={fotoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFotoUpload} />
                </div>
              </div>
              <div className="perfilSideInfo">
                <h2>{nomeExibido}</h2>
                <p className="perfilCargo">{funcionario?.cargo || "Colaborador"}</p>
                <p className="perfilBio">
                  <EditableField label="Bio" value={perfil?.bio} onChange={v => salvarPerfil("bio", v)} multiline />
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
                { label: "GITHUB",    icon: faGithub,   campo: "github",    placeholder: "github.com/usuario" },
                { label: "LINKEDIN",  icon: faLinkedin, campo: "linkedin",  placeholder: "linkedin.com/in/usuario" },
                { label: "PORTFOLIO", icon: faLink,     campo: "portfolio", placeholder: "meuportfolio.com" },
              ].map(l => (
                <div key={l.campo} className="perfilLinkItem">
                  <div className="perfilLinkIcone"><FontAwesomeIcon icon={l.icon} /></div>
                  <div className="perfilLinkConteudo">
                    <span className="perfilLinkLabel">{l.label}</span>
                    <EditableField label={l.label} value={perfil?.[l.campo]} onChange={v => salvarPerfil(l.campo, v)} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Main ── */}
          <div className="perfilMain">
            {/* Contato pessoal */}
            <div className="perfilCard">
              <h3 className="perfilCardTitulo">Contato</h3>
              <div className="perfilContatoGrid">
                <div className="perfilContatoItem">
                  <div className="perfilContatoIconeWrap"><FontAwesomeIcon icon={faEnvelope} /></div>
                  <div>
                    <span className="perfilContatoLabel">E-MAIL</span>
                    <p className="perfilContatoValor">{funcionario?.email || "—"}</p>
                  </div>
                </div>
                <div className="perfilContatoItem">
                  <div className="perfilContatoIconeWrap"><FontAwesomeIcon icon={faPhone} /></div>
                  <div style={{ flex: 1 }}>
                    <span className="perfilContatoLabel">TELEFONE</span>
                    <EditableField
                      label="Telefone"
                      value={funcionario?.telefone}
                      onChange={v => salvarFuncionario("telefone", v)}
                      type="tel"
                    />
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
                    <input className="perfilInput perfilInput--sm" value={novaHabilidade} onChange={e => setNovaHabilidade(e.target.value)} placeholder="Nova habilidade" onKeyDown={e => { if (e.key === "Enter") addHabilidade() }} />
                    <button className="perfilIconBtn perfilIconBtn--ok" onClick={addHabilidade}><FontAwesomeIcon icon={faPlus} /></button>
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
                <button className="perfilTextBtn" onClick={() => setModalExp(true)}>Adicionar</button>
              </div>
              {experiencias.length === 0 && <p className="perfilVazio">Nenhuma experiência adicionada ainda</p>}
              {experiencias.map((exp, i) => (
                <div key={i} className="perfilExpItem">
                  <div className="perfilExpIcone"><FontAwesomeIcon icon={exp.tipo === "educacao" ? faGraduationCap : faBriefcase} /></div>
                  <div className="perfilExpInfo">
                    <p className="perfilExpCargo">{exp.cargo}</p>
                    <p className="perfilExpEmpresa">{exp.empresa}</p>
                    <p className="perfilExpPeriodo">{exp.inicio}{exp.fim ? ` - ${exp.fim}` : " - Presente"}</p>
                  </div>
                  <button className="perfilIconBtn perfilIconBtn--no" onClick={() => removeExperiencia(i)}><FontAwesomeIcon icon={faXmark} /></button>
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
                return (
                  <div key={p.id_projeto} className="perfilProjetoItem">
                    <div className="perfilProjetoIcone"><FontAwesomeIcon icon={faFolderOpen} /></div>
                    <div className="perfilProjetoInfo">
                      <div className="perfilProjetoNomeLinha">
                        <p className="perfilProjetoNome">{p.nome_projeto}</p>
                        <span className={`perfilProjetoStatus ${pct < 100 ? "perfilProjetoStatus--ativo" : "perfilProjetoStatus--conc"}`}>{pct < 100 ? "Ativo" : "Concluído"}</span>
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

  // ══════════════════════════════════════════════════════
  // VISÃO DO DONO
  // ══════════════════════════════════════════════════════
  const totalTarefas = tarefas.length
  const concluidas   = tarefas.filter(t => t.concluido).length
  const taxaConc     = totalTarefas > 0 ? Math.round((concluidas / totalTarefas) * 100) : 0

  return (
    <div className="perfilPage">
      {/* Toast */}
      <div className={`perfilToast ${toastOn ? "ativo" : ""}`}>{toastMsg}</div>

      <div className="perfilLayout">
        {/* ── Sidebar ── */}
        <div className="perfilSidebar">
          <div className="perfilSideCard">
            <div className="perfilBanner perfilBanner--empresa">
              {/* Avatar com upload */}
              <div className="perfilAvatarUploadWrap perfilAvatarUploadWrap--empresa">
                {fotoUrl
                  ? <img src={fotoUrl} alt="logo" className="perfilAvatarEmpresaImg" />
                  : <div className="perfilAvatarEmpresa">{iniciais}</div>
                }
                <button
                  className="perfilAvatarUploadBtn"
                  onClick={() => fotoInputRef.current?.click()}
                  title="Alterar logo"
                  disabled={uploadandoFoto}
                >
                  <FontAwesomeIcon icon={faCamera} />
                </button>
                <input ref={fotoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFotoUpload} />
              </div>
            </div>
            <div className="perfilSideInfo">
              <h2 className="perfilEmpresaNome">{empresa?.nome || "—"}</h2>
              <p className="perfilCargo">{empresa?.areaatuacao || "Empresa"}</p>
              {empresa?.cnpj && <p className="perfilCargo" style={{ fontSize: 11 }}>CNPJ: {empresa.cnpj}</p>}
              <div className="perfilMetaLista">
                <span className="perfilMetaItem"><FontAwesomeIcon icon={faUsers} /> {funcionarios.length} colaboradores</span>
                <span className="perfilMetaItem"><FontAwesomeIcon icon={faFolderOpen} /> {projetos.length} projetos</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main ── */}
        <div className="perfilMain">

          {/* ── Card: Informações da Empresa (editável) ── */}
          <div className="perfilCard">
            <div className="perfilCardHeader">
              <h3 className="perfilCardTitulo"><FontAwesomeIcon icon={faBuilding} /> Informações da Empresa</h3>
            </div>
            <div className="perfilEmpresaInfoGrid">
              <div className="perfilEmpresaInfoItem">
                <span className="perfilContatoLabel">NOME DA EMPRESA</span>
                <EditableField label="Nome" value={empresa?.nome} onChange={v => salvarEmpresa("nome", v)} />
              </div>
              <div className="perfilEmpresaInfoItem">
                <span className="perfilContatoLabel">ÁREA DE ATUAÇÃO</span>
                <EditableField label="Área de atuação" value={empresa?.areaatuacao} onChange={v => salvarEmpresa("areaatuacao", v)} />
              </div>
              {escopo === "empresa" && (
                <>
                  <div className="perfilEmpresaInfoItem">
                    <span className="perfilContatoLabel">CNPJ</span>
                    <EditableField label="CNPJ" value={empresa?.cnpj} onChange={v => salvarEmpresa("cnpj", v)} />
                  </div>
                  <div className="perfilEmpresaInfoItem">
                    <span className="perfilContatoLabel">CEP</span>
                    <EditableField label="CEP" value={empresa?.cep} onChange={v => salvarEmpresa("cep", v)} />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Card: Contato da Empresa ── */}
          <div className="perfilCard">
            <h3 className="perfilCardTitulo"><FontAwesomeIcon icon={faBuilding} style={{ marginRight: 8 }} />Contato da Empresa</h3>
            <p className="perfilCardSub" style={{ marginBottom: 16 }}>Informações de contato visíveis publicamente para a empresa</p>
            <div className="perfilContatoGrid">
              <div className="perfilContatoItem">
                <div className="perfilContatoIconeWrap"><FontAwesomeIcon icon={faEnvelope} /></div>
                <div style={{ flex: 1 }}>
                  <span className="perfilContatoLabel">E-MAIL DA EMPRESA</span>
                  <EditableField
                    label="E-mail da empresa"
                    value={empresa?.dono_email}
                    onChange={v => salvarEmpresa("dono_email", v)}
                    type="email"
                  />
                </div>
              </div>
              <div className="perfilContatoItem">
                <div className="perfilContatoIconeWrap"><FontAwesomeIcon icon={faPhone} /></div>
                <div style={{ flex: 1 }}>
                  <span className="perfilContatoLabel">TELEFONE DA EMPRESA</span>
                  {/* Campo telefone na tabela empresas/startups - ver INSTRUCOES.md */}
                  <EditableField
                    label="Telefone da empresa"
                    value={empresa?.telefone}
                    onChange={v => salvarEmpresa("telefone", v)}
                    type="tel"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Card: Contato Pessoal do Dono ── */}
          <div className="perfilCard">
            <h3 className="perfilCardTitulo"><FontAwesomeIcon icon={faIdCard} style={{ marginRight: 8 }} />Contato Pessoal</h3>
            <p className="perfilCardSub" style={{ marginBottom: 16 }}>Informações pessoais do responsável pela conta</p>
            <div className="perfilContatoGrid">
              <div className="perfilContatoItem">
                <div className="perfilContatoIconeWrap"><FontAwesomeIcon icon={faEnvelope} /></div>
                <div>
                  <span className="perfilContatoLabel">E-MAIL PESSOAL</span>
                  <p className="perfilContatoValor">{usuarioDono?.email || "—"}</p>
                </div>
              </div>
              <div className="perfilContatoItem">
                <div className="perfilContatoIconeWrap"><FontAwesomeIcon icon={faPhone} /></div>
                <div style={{ flex: 1 }}>
                  <span className="perfilContatoLabel">TELEFONE PESSOAL</span>
                  <EditableField
                    label="Telefone pessoal"
                    value={usuarioDono?.telefone}
                    onChange={v => salvarUsuarioDono("telefone", v)}
                    type="tel"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Stats da empresa ── */}
          <div className="perfilCard">
            <h3 className="perfilCardTitulo">Visão Geral</h3>
            <div className="perfilEmpresaStats">
              {[
                { label: "Membros",        valor: funcionarios.length, icon: faUsers,         cor: "azul" },
                { label: "Projetos",       valor: projetos.length,     icon: faFolderOpen,     cor: "verde" },
                { label: "Tarefas",        valor: totalTarefas,        icon: faListCheck,      cor: "neutro" },
                { label: "Taxa Conclusão", valor: `${taxaConc}%`,      icon: faArrowTrendUp,   cor: "amarelo" },
              ].map(s => (
                <div key={s.label} className={`perfilStatCard perfilStatCard--${s.cor}`}>
                  <FontAwesomeIcon icon={s.icon} className="perfilStatIcone" />
                  <strong>{s.valor}</strong>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Equipe ── */}
          <div className="perfilCard">
            <h3 className="perfilCardTitulo">Equipe ({funcionarios.length})</h3>
            {funcionarios.length === 0 && <p className="perfilVazio">Nenhum membro ainda</p>}
            {funcionarios.map(f => {
              const inics = f.nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
              const tf    = tarefas.filter(t => t.cpf_responsavel === f.cpf)
              const conc  = tf.filter(t => t.concluido).length
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

          {/* ── Projetos da empresa ── */}
          <div className="perfilCard">
            <div className="perfilCardHeader">
              <h3 className="perfilCardTitulo">Projetos</h3>
              <span className="perfilTextBtn">{projetos.length} projetos</span>
            </div>
            {projetos.map(p => {
              const pct = progressoProjeto(p.id_projeto)
              return (
                <div key={p.id_projeto} className="perfilProjetoItem">
                  <div className="perfilProjetoIcone"><FontAwesomeIcon icon={faFolderOpen} /></div>
                  <div className="perfilProjetoInfo">
                    <div className="perfilProjetoNomeLinha">
                      <p className="perfilProjetoNome">{p.nome_projeto}</p>
                      <span className={`perfilProjetoStatus ${pct < 100 ? "perfilProjetoStatus--ativo" : "perfilProjetoStatus--conc"}`}>{pct < 100 ? "Ativo" : "Concluído"}</span>
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