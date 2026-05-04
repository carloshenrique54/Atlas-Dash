import { useEffect, useState } from "react"
import { supabase } from "../services/supabase"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faEnvelope, faPhone, faCircleCheck,
  faFolderOpen, faCopy, faCheck, faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons"
import { faInstagram, faLinkedin } from "@fortawesome/free-brands-svg-icons"
import FuncionarioDetalhe from "./FuncionarioDetalhe"
import "../styles/Equipe.css"
import { useNavigate } from "react-router-dom"

function Equipe() {
  const usuario    = localStorage.getItem("usuario")
  const usuarioObj = usuario ? JSON.parse(usuario) : null
  const idEmpresa  = parseInt(usuarioObj?.empresa_id)
  const isFuncionario = usuarioObj?.cargo === "funcionario"

  const [escopo, setEscopo]             = useState(null)
  const [funcionarios, setFuncionarios] = useState([])
  const [tarefas, setTarefas]           = useState([])
  const [projetos, setProjetos]         = useState([])
  const [codigoConvite, setCodigoConvite] = useState("")
  const [carregando, setCarregando]     = useState(true)
  const [copiado, setCopiado]           = useState(false)
  const [busca, setBusca]               = useState("")
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null)
  const navigate = useNavigate

  useEffect(() => {
    if(!usuario){navigate("/dashboard")}
  }, [navigate]) 

  // ── Detectar escopo ──────────────────────────────────────────────────
  useEffect(() => {
    async function detectar() {
      if (!idEmpresa || isNaN(idEmpresa)) return
      const { data: s } = await supabase.from("startups").select("id, codigoconvite").eq("id", idEmpresa).maybeSingle()
      if (s) { setEscopo("startup"); setCodigoConvite(s.codigoconvite || ""); return }
      const { data: e } = await supabase.from("empresas").select("id, codigoconvite").eq("id", idEmpresa).maybeSingle()
      if (e) { setEscopo("empresa"); setCodigoConvite(e.codigoconvite || "") }
    }
    detectar()
  }, [idEmpresa])

  // ── Carregar dados ───────────────────────────────────────────────────
  useEffect(() => {
    if (!idEmpresa || !escopo) return
    async function carregar() {
      setCarregando(true)

      let fq = supabase.from("funcionarios").select("*")
      fq = escopo === "startup" ? fq.eq("startup_id", idEmpresa) : fq.eq("empresa_id", idEmpresa)
      const { data: f } = await fq
      setFuncionarios(f || [])

      let tq = supabase.from("tarefas").select("*")
      tq = escopo === "startup" ? tq.eq("id_startup", idEmpresa) : tq.eq("id_empresa", idEmpresa)
      const { data: t } = await tq
      setTarefas(t || [])

      let pq = supabase.from("projetos").select("id_projeto, nome_projeto, cpf_participantes")
      pq = escopo === "startup" ? pq.eq("startup_id", idEmpresa) : pq.eq("empresa_id", idEmpresa)
      const { data: p } = await pq
      setProjetos(p || [])

      setCarregando(false)
    }
    carregar()
  }, [idEmpresa, escopo])

  // ── Helpers ──────────────────────────────────────────────────────────
  function tarefasDo(cpf) { return tarefas.filter(t => t.cpf_responsavel === cpf) }

  function projetosDo(cpf) {
    return projetos.filter(p => {
      const arr = p.cpf_participantes
      if (!arr) return false
      const lista = Array.isArray(arr) ? arr : arr.replace(/[{}]/g, "").split(",").filter(Boolean)
      return lista.includes(cpf)
    })
  }

  async function copiarCodigo() {
    if (!codigoConvite) return
    await navigator.clipboard.writeText(codigoConvite)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const funcionariosFiltrados = funcionarios.filter(f =>
    f.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (f.email || "").toLowerCase().includes(busca.toLowerCase())
  )

  // ── Se alguém clicou num funcionário ────────────────────────────────
  if (funcionarioSelecionado) {
    return (
      <FuncionarioDetalhe
        funcionario={funcionarioSelecionado}
        tarefas={tarefasDo(funcionarioSelecionado.cpf)}
        projetos={projetosDo(funcionarioSelecionado.cpf)}
        escopo={escopo}
        idEmpresa={idEmpresa}
        isDono={!isFuncionario}
        onVoltar={() => setFuncionarioSelecionado(null)}
      />
    )
  }

  return (
    <div className="equipePage">

      {/* Topo */}
      <div className="equipeTopBar">
        <div className="equipeBusca">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="equipeBuscaIcone" />
          <input
            type="text"
            placeholder="Buscar membro..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>

        <div className="equipeTopDir">
          <span className="equipeCount">{funcionariosFiltrados.length} membro(s)</span>
          {!isFuncionario && codigoConvite && (
            <button className="equipeCopiaBotao" onClick={copiarCodigo}>
              <FontAwesomeIcon icon={copiado ? faCheck : faCopy} />
              {copiado ? "Copiado!" : `Código: ${codigoConvite}`}
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {carregando ? (
        <div className="equipeLoading">Carregando equipe...</div>
      ) : funcionariosFiltrados.length === 0 ? (
        <div className="equipeVazio">
          <p>Nenhum membro encontrado</p>
        </div>
      ) : (
        <div className="equipeGrid">
          {funcionariosFiltrados.map(f => {
            const iniciais = f.nome.split(" ").slice(0,2).map(n=>n[0]).join("").toUpperCase()
            const tf = tarefasDo(f.cpf)
            const conc = tf.filter(t => t.concluido).length
            const pf = projetosDo(f.cpf)

            return (
              <div
                key={f.id}
                className="equipeCard equipeCard--clicavel"
                onClick={() => setFuncionarioSelecionado(f)}
              >
                {/* Cabeçalho do card */}
                <div className="equipeCardTopo">
                  <div className="equipeAvatarWrap">
                    <div className="equipeAvatar">{iniciais}</div>
                    <span className="equipeOnlineDot" />
                  </div>
                  <div className="equipeCardInfo">
                    <div className="equipeCardNomeLinha">
                      <h3>{f.nome}</h3>
                      <span className="equipeOnlineBadge">● Online</span>
                    </div>
                    <p className="equipeCardCargo">{f.cargo || "Colaborador"}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="equipeCardStats">
                  <span className="equipeStatItem equipeStatItem--verde">
                    <FontAwesomeIcon icon={faCircleCheck} />
                    {conc} concluídas
                  </span>
                  <span className="equipeStatItem">
                    <FontAwesomeIcon icon={faFolderOpen} />
                    {pf.length} projetos
                  </span>
                </div>

                {/* Tags de projetos */}
                {pf.length > 0 && (
                  <div className="equipeCardTags">
                    {pf.slice(0,3).map(p => (
                      <span key={p.id_projeto} className="equipeTag">{p.nome_projeto}</span>
                    ))}
                  </div>
                )}

                <div className="equipeCardDivider" />

                {/* Contatos */}
                <div className="equipeCardContatos">
                  <div className="equipeContatoLinha">
                    <span className="equipeContato">
                      <FontAwesomeIcon icon={faEnvelope} /> {f.email || "—"}
                    </span>
                    <span className="equipeContato">
                      <FontAwesomeIcon icon={faPhone} /> {f.telefone || "—"}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Equipe