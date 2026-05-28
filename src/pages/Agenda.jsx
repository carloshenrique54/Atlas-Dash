import { useEffect, useState } from "react"
import { supabase } from "../services/supabase"
import CalendarioAgenda from "../components/CalendarioAgenda.jsx"
import "../styles/Agenda.css"
import { useNavigate } from "react-router-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faPlus, faXmark, faClock, faUsers, faVideo,
  faCalendarDays, faCircleXmark,
  faCalendar,
} from "@fortawesome/free-solid-svg-icons"

const TIPOS_EVENTO = [
  { id: "reuniao",   label: "Reunião",    icon: faUsers,         cor: "#3647ff" },
  { id: "prazo",     label: "Prazo",      icon: faClock,         cor: "#E24B4A" },
  { id: "call",      label: "Call",       icon: faVideo,         cor: "#a136ff" },
  { id: "outro",     label: "Outro",      icon: faCalendarDays,  cor: "#8a97a8" },
]

const PRIORIDADE_COR = { alta: "#E24B4A", media: "#EF9F27", baixa: "#1D9E75" }
const PRIORIDADE_LABEL = { alta: "ALTA", media: "MÉDIA", baixa: "BAIXA" }

function Agenda() {
  const usuario    = localStorage.getItem("usuario")
  const usuarioObj = usuario ? JSON.parse(usuario) : null
  const CPF        = usuarioObj?.cpf ?? ""
  const idEmpresa  = usuarioObj?.empresa_id
  const isFuncionario = usuarioObj?.cargo === "funcionario"

  const [escopoAgenda,  setEscopoAgenda]  = useState(null)
  const [tarefas,       setTarefas]       = useState([])
  const [eventos,       setEventos]       = useState([])
  const [funcionarios,  setFuncionarios]  = useState([])
  const [dataSelecionada, setDataSelecionada] = useState(new Date())
  const [carregando,    setCarregando]    = useState(true)
  const navigate = useNavigate()

  // Modal de criar evento
  const [modalEvento,    setModalEvento]    = useState(false)
  const [tituloEvento,   setTituloEvento]   = useState("")
  const [descEvento,     setDescEvento]     = useState("")
  const [dataEvento,     setDataEvento]     = useState("")
  const [horaEvento,     setHoraEvento]     = useState("")
  const [tipoEvento,     setTipoEvento]     = useState("reuniao")
  const [salvandoEvento, setSalvandoEvento] = useState(false)

  const delay = (ms) => new Promise(r => setTimeout(r, ms))
  const [abrirToastErro, setAbrirToastErro]   = useState(false);
  const [mensagemErroToast, setMensagemErroToast] = useState("");
  const [abrirToastCerto, setAbrirToastCerto]  = useState(false);
  const [mensagemCertoToast, setMensagemCertoToast] = useState("");

  useEffect(() => { if (!usuario) { navigate("/") } }, [navigate])

  // ── Detectar escopo ──────────────────────────────────────────────────
  useEffect(() => {
    async function detectarEscopo() {
      if (!idEmpresa) return
      const { data: startup } = await supabase.from("startups").select("id").eq("id", idEmpresa).maybeSingle()
      if (startup) { setEscopoAgenda("startup"); return }
      const { data: empresa } = await supabase.from("empresas").select("id").eq("id", idEmpresa).maybeSingle()
      if (empresa) setEscopoAgenda("empresa")
    }
    detectarEscopo()
  }, [idEmpresa])

  // ── Carregar dados ───────────────────────────────────────────────────
  useEffect(() => {
    if (!idEmpresa || !escopoAgenda) return
    async function carregarDados() {
      setCarregando(true)

      // Tarefas com prazo
      let tq = supabase.from("tarefas").select("*")
      if (escopoAgenda === "startup") tq = tq.eq("id_startup", idEmpresa)
      else tq = tq.eq("id_empresa", idEmpresa)
      if (isFuncionario) tq = tq.eq("cpf_responsavel", CPF)
      const { data: tarefasData } = await tq
      setTarefas(tarefasData || [])

      // Eventos customizados (tabela eventos)
      let eq = supabase.from("eventos").select("*")
      if (escopoAgenda === "startup") eq = eq.eq("startup_id", idEmpresa)
      else eq = eq.eq("empresa_id", idEmpresa)
      const { data: eventosData } = await eq
      setEventos(eventosData || [])

      // Funcionários (para dono)
      if (!isFuncionario) {
        let fq = supabase.from("funcionarios").select("nome, cpf")
        if (escopoAgenda === "startup") fq = fq.eq("startup_id", idEmpresa)
        else fq = fq.eq("empresa_id", idEmpresa)
        const { data: funcData } = await fq
        setFuncionarios(funcData || [])
      }

      setCarregando(false)
    }
    carregarDados()
  }, [idEmpresa, escopoAgenda, CPF, isFuncionario])

  // ── Helpers ──────────────────────────────────────────────────────────
  function diaSelecionadoStr(data) {
    return data.toISOString().split("T")[0]
  }

  function tarefasDoDia(data) {
    const diaStr = diaSelecionadoStr(data)
    return tarefas.filter(t => {
      if (!t.dia_prazo) return false
      return new Date(t.dia_prazo).toISOString().split("T")[0] === diaStr
    })
  }

  function eventosDoDia(data) {
    const diaStr = diaSelecionadoStr(data)
    return eventos.filter(e => {
      if (!e.data_evento) return false
      return new Date(e.data_evento).toISOString().split("T")[0] === diaStr
    })
  }

  // Dias com eventos (para marcar dots no calendário)
  const diasComMarcador = {}

  tarefas.forEach(t => {
    if (!t.dia_prazo) return
    const dia = new Date(t.dia_prazo).toISOString().split("T")[0]
    if (!diasComMarcador[dia]) diasComMarcador[dia] = []
    diasComMarcador[dia].push({ tipo: "tarefa", prioridade: t.prioridade })
  })

  eventos.forEach(e => {
    if (!e.data_evento) return
    const dia = new Date(e.data_evento).toISOString().split("T")[0]
    if (!diasComMarcador[dia]) diasComMarcador[dia] = []
    diasComMarcador[dia].push({ tipo: "evento", tipoEvento: e.tipo })
  })

  function getNomeFuncionario(cpf) {
    const func = funcionarios.find(f => f.cpf === cpf)
    return func ? func.nome : cpf
  }

  function formatarDataHeader(data) {
    return data.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "short", year: "numeric" })
  }

  function getTipoInfo(tipo) {
    return TIPOS_EVENTO.find(t => t.id === tipo) || TIPOS_EVENTO[3]
  }

  // ── Criar evento ─────────────────────────────────────────────────────
  async function cadastrarEvento(e) {
    e.preventDefault()
    if (!tituloEvento) { setMensagemErroToast("Coloque um titulo no evento"); setAbrirToastErro(true); await delay(2000); setAbrirToastErro(false); return; }
    if (!dataEvento) { setMensagemErroToast("Coloque uma data no evento"); setAbrirToastErro(true); await delay(2000); setAbrirToastErro(false); return; }

    setSalvandoEvento(true)

    const payload = {
      titulo:       tituloEvento,
      descricao:    descEvento || null,
      data_evento:  dataEvento,
      hora_evento:  horaEvento || null,
      tipo:         tipoEvento,
      cpf_criador:  CPF,
    }

    if (escopoAgenda === "startup") payload.startup_id = idEmpresa
    else payload.empresa_id = idEmpresa

    const { data: novoEvento, error } = await supabase
      .from("eventos")
      .insert([payload])
      .select()
      .single()

    setSalvandoEvento(false)

    setMensagemCertoToast("Evento Cadastrado"); 
    setAbrirToastCerto(true);
    setModalEvento(false);
    await delay(2000);
    setAbrirToastCerto(false);
  }

  async function deletarEvento(idEvento) {
    await supabase.from("eventos").delete().eq("id", idEvento)
    setEventos(prev => prev.filter(e => e.id !== idEvento))
    setMensagemCertoToast("Evento Removido")
    setAbrirToastCerto(true)
    await delay(3000)
    setAbrirToastCerto(false)
  }

  const tarefasDia  = tarefasDoDia(dataSelecionada)
  const eventosDia  = eventosDoDia(dataSelecionada)
  const totalDia    = tarefasDia.length + eventosDia.length

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <main className="mainAgenda">
      {/* Toast */}
      <div className={!abrirToastErro ? "modalAviso" : "modalAviso ativo"}><h3>{mensagemErroToast}</h3></div>
      <div className={!abrirToastCerto ? "toast" : "toast ativo"}>{mensagemCertoToast}</div>

      {/* Modal criar evento */}
      {modalEvento && (
        <div className="agendaFormOverlay" onClick={ev => { if (ev.target === ev.currentTarget) setModalEvento(false) }}>
          <form className="agendaForm" onSubmit={cadastrarEvento}>
            <div className="agendaFormHeader">
              <h2>Novo Evento</h2>
              <button type="button" className="agendaFormFechar" onClick={() => setModalEvento(false)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="agendaFormCorpo">
              {/* Tipo */}
              <label>Tipo de evento</label>
              <div className="agendaTiposGrid">
                {TIPOS_EVENTO.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    className={`agendaTipoBotao ${tipoEvento === t.id ? "ativo" : ""}`}
                    style={{ "--tipo-cor": t.cor }}
                    onClick={() => setTipoEvento(t.id)}
                  >
                    <FontAwesomeIcon icon={t.icon} />
                    {t.label}
                  </button>
                ))}
              </div>

              <label>Título</label>
              <input
                type="text"
                className="agendaFormInput"
                value={tituloEvento}
                onChange={e => setTituloEvento(e.target.value)}
                placeholder="Ex: Reunião de alinhamento"
              />

              <div className="agendaFormLinha">
                <div>
                  <label>Data</label>
                  <input
                    type="date"
                    className="agendaFormInput"
                    value={dataEvento}
                    onChange={e => setDataEvento(e.target.value)}
                  />
                </div>
                <div>
                  <label>Horário (opcional)</label>
                  <input
                    type="time"
                    className="agendaFormInput"
                    value={horaEvento}
                    onChange={e => setHoraEvento(e.target.value)}
                  />
                </div>
              </div>

              <label>Descrição (opcional)</label>
              <textarea
                className="agendaFormInput agendaFormTextarea"
                value={descEvento}
                onChange={e => setDescEvento(e.target.value)}
                placeholder="Descreva o evento..."
                rows={3}
              />

              <div className="agendaFormBotoes">
                <button type="submit" className="agendaFormSalvar" disabled={salvandoEvento}>
                  {salvandoEvento ? "Salvando..." : "Criar Evento"}
                </button>
                <button type="button" className="agendaFormCancelar" onClick={() => setModalEvento(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Calendário esquerda */}
      <div className="agendaEsquerda">
        <div className="agendaBotaoNovoEvento">
          <button className="agendaNovoEventoBtn" onClick={() => setModalEvento(true)}>
            <FontAwesomeIcon icon={faPlus} /> Novo Evento
          </button>
        </div>

        <CalendarioAgenda
          dataSelecionada={dataSelecionada}
          onChange={setDataSelecionada}
          diasComTarefas={diasComMarcador}
        />

        {/* Legenda */}
        <div className="agendaLegenda">
          {[
            { label: "Alta",     cor: "#E24B4A" },
            { label: "Média",    cor: "#EF9F27" },
            { label: "Baixa",    cor: "#1D9E75" },
            { label: "Reunião",  cor: "#3647ff" },
            { label: "Call",     cor: "#a136ff" },
          ].map(l => (
            <span key={l.label} className="agendaLegendaItem">
              <span className="agendaLegendaDot" style={{ background: l.cor }} /> {l.label}
            </span>
          ))}
        </div>
      </div>

      {/* Painel direita */}
      <div className="agendaDireita">
        <div className="agendaDireitaHeader">
          <p className="agendaDireitaData">{formatarDataHeader(dataSelecionada)}</p>
          <span className="agendaDireitaCount">
            {totalDia === 0 ? "Sem eventos" : `${totalDia} ${totalDia === 1 ? "evento" : "eventos"}`}
          </span>
        </div>

        <div className="agendaEventosLista">
          {carregando ? (
            <div className="agendaSemEventos">
              <div className="agendaLoadingDot" />
              <p>Carregando...</p>
            </div>
          ) : totalDia === 0 ? (
            <div className="agendaSemEventos">
              <div className="agendaSemEventosIcone"><FontAwesomeIcon icon={faCalendar}/></div>
              <p>Sem eventos para este dia</p>
              <button className="agendaNovoEventoBtnSm" onClick={() => { setDataEvento(dataSelecionada.toISOString().split("T")[0]); setModalEvento(true) }}>
                <FontAwesomeIcon icon={faPlus} /> Adicionar evento
              </button>
            </div>
          ) : (
            <>
              {/* Eventos customizados */}
              {eventosDia.map(evento => {
                const tipoInfo = getTipoInfo(evento.tipo)
                return (
                  <div key={evento.id} className="agendaEventoCard agendaEventoCard--evento">
                    <div className="agendaEventoTopo">
                      <span className="agendaEventoDot" style={{ background: tipoInfo.cor }} />
                      <span className="agendaEventoTipo" style={{ color: tipoInfo.cor }}>
                        <FontAwesomeIcon icon={tipoInfo.icon} /> {tipoInfo.label.toUpperCase()}
                      </span>
                      {!isFuncionario && (
                        <button className="agendaDeletarEvento" onClick={() => deletarEvento(evento.id)} title="Remover evento">
                          <FontAwesomeIcon icon={faCircleXmark} />
                        </button>
                      )}
                    </div>
                    <h3 className="agendaEventoTitulo">{evento.titulo}</h3>
                    {evento.hora_evento && (
                      <p className="agendaEventoHora">
                        <FontAwesomeIcon icon={faClock} /> {evento.hora_evento}
                      </p>
                    )}
                    {evento.descricao && (
                      <p className="agendaEventoDesc">{evento.descricao}</p>
                    )}
                  </div>
                )
              })}

              {/* Tarefas com prazo neste dia */}
              {tarefasDia.map(tarefa => (
                <div key={tarefa.id} className="agendaEventoCard">
                  <div className="agendaEventoTopo">
                    <span className="agendaEventoDot" style={{ background: PRIORIDADE_COR[tarefa.prioridade] || "#888" }} />
                    <span className="agendaEventoTipo" style={{ color: PRIORIDADE_COR[tarefa.prioridade] || "#888" }}>
                      PRAZO · {PRIORIDADE_LABEL[tarefa.prioridade] || "—"}
                    </span>
                  </div>
                  <h3 className="agendaEventoTitulo">{tarefa.titulo}</h3>
                  <p className="agendaEventoHora">⏱ Todo o dia</p>
                  {tarefa.descricao && <p className="agendaEventoDesc">{tarefa.descricao}</p>}
                  {!isFuncionario && tarefa.cpf_responsavel && (
                    <div className="agendaEventoResponsavel">
                      <span className="agendaEventoResponsavelAvatar">
                        {getNomeFuncionario(tarefa.cpf_responsavel).charAt(0).toUpperCase()}
                      </span>
                      <span>{getNomeFuncionario(tarefa.cpf_responsavel)}</span>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </main>
  )
}

export default Agenda