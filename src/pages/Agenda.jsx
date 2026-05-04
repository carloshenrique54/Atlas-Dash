import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import CalendarioAgenda from "../components/CalendarioAgenda.jsx";
import "../styles/Agenda.css";
import { useNavigate } from "react-router-dom";

function Agenda() {
  const usuario = localStorage.getItem("usuario");
  const usuarioObj = usuario ? JSON.parse(usuario) : null;
  const CPF = usuarioObj?.cpf ?? "";
  const idEmpresa = usuarioObj?.empresa_id;
  const isFuncionario = usuarioObj?.cargo === "funcionario";

  const [escopoAgenda, setEscopoAgenda] = useState(null);
  const [tarefas, setTarefas] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate()

  useEffect(() => {
    if(!usuario){navigate("/dashboard")}
  }, [navigate]) 

  // Detecta se é startup ou empresa (mesma lógica de Tarefas.jsx)
  useEffect(() => {
    async function detectarEscopo() {
      if (!idEmpresa) return;
      const { data: startup } = await supabase
        .from("startups")
        .select("id")
        .eq("id", idEmpresa)
        .maybeSingle();
      if (startup) { setEscopoAgenda("startup"); return; }
      const { data: empresa } = await supabase
        .from("empresas")
        .select("id")
        .eq("id", idEmpresa)
        .maybeSingle();
      if (empresa) { setEscopoAgenda("empresa"); return; }
      setEscopoAgenda(null);
    }
    detectarEscopo();
  }, [idEmpresa]);

  // Busca tarefas e funcionários
  useEffect(() => {
    async function carregarDados() {
      if (!idEmpresa || !escopoAgenda) return;
      setCarregando(true);

      // Tarefas
      let query = supabase.from("tarefas").select("*");
      if (escopoAgenda === "startup") query = query.eq("id_startup", idEmpresa);
      else query = query.eq("id_empresa", idEmpresa);
      if (isFuncionario) query = query.eq("cpf_responsavel", CPF);

      const { data: tarefasData } = await query;

      // Funcionários (para exibir nome do responsável se for dono)
      if (!isFuncionario) {
        let fQuery = supabase.from("funcionarios").select("nome, cpf");
        if (escopoAgenda === "startup") fQuery = fQuery.eq("startup_id", idEmpresa);
        else fQuery = fQuery.eq("empresa_id", idEmpresa);
        const { data: funcData } = await fQuery;
        setFuncionarios(funcData || []);
      }

      setTarefas(tarefasData || []);
      setCarregando(false);
    }
    carregarDados();
  }, [idEmpresa, escopoAgenda, CPF, isFuncionario]);

  // Tarefas do dia selecionado
  function tarefasDoDia(data) {
    const diaStr = data.toISOString().split("T")[0];
    return tarefas.filter((t) => {
      if (!t.dia_prazo) return false;
      const prazoStr = new Date(t.dia_prazo).toISOString().split("T")[0];
      return prazoStr === diaStr;
    });
  }

  // Dias que têm tarefas (para marcar dots)
  const diasComTarefas = tarefas.reduce((acc, t) => {
    if (!t.dia_prazo) return acc;
    const dia = new Date(t.dia_prazo).toISOString().split("T")[0];
    if (!acc[dia]) acc[dia] = [];
    acc[dia].push(t);
    return acc;
  }, {});

  const eventosDoDia = tarefasDoDia(dataSelecionada);

  function getNomeFuncionario(cpf) {
    const func = funcionarios.find((f) => f.cpf === cpf);
    return func ? func.nome : cpf;
  }

  function formatarDataHeader(data) {
    return data.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const prioridadeCor = {
    alta: "#E24B4A",
    media: "#EF9F27",
    baixa: "#1D9E75",
  };

  const prioridadeLabel = {
    alta: "ALTA",
    media: "MÉDIA",
    baixa: "BAIXA",
  };

  return (
    <main className="mainAgenda">
      {/* Calendário esquerda */}
      <div className="agendaEsquerda">
        <CalendarioAgenda
          dataSelecionada={dataSelecionada}
          onChange={setDataSelecionada}
          diasComTarefas={diasComTarefas}
        />
      </div>

      {/* Painel de eventos direita */}
      <div className="agendaDireita">
        <div className="agendaDireitaHeader">
          <p className="agendaDireitaData">{formatarDataHeader(dataSelecionada)}</p>
          <span className="agendaDireitaCount">
            {eventosDoDia.length === 0
              ? "Sem eventos"
              : `${eventosDoDia.length} ${eventosDoDia.length === 1 ? "evento" : "eventos"}`}
          </span>
        </div>

        <div className="agendaEventosLista">
          {carregando ? (
            <div className="agendaSemEventos">
              <div className="agendaLoadingDot" />
              <p>Carregando...</p>
            </div>
          ) : eventosDoDia.length === 0 ? (
            <div className="agendaSemEventos">
              <div className="agendaSemEventosIcone">📅</div>
              <p>Sem eventos para este dia</p>
            </div>
          ) : (
            eventosDoDia.map((tarefa) => (
              <div key={tarefa.id} className="agendaEventoCard">
                <div className="agendaEventoTopo">
                  <span
                    className="agendaEventoDot"
                    style={{ background: prioridadeCor[tarefa.prioridade] || "#888" }}
                  />
                  <span
                    className="agendaEventoTipo"
                    style={{ color: prioridadeCor[tarefa.prioridade] || "#888" }}
                  >
                    PRAZO · {prioridadeLabel[tarefa.prioridade] || "—"}
                  </span>
                </div>
                <h3 className="agendaEventoTitulo">{tarefa.titulo}</h3>
                <p className="agendaEventoHora">⏱ Todo o dia</p>
                {tarefa.descricao && (
                  <p className="agendaEventoDesc">{tarefa.descricao}</p>
                )}
                {!isFuncionario && tarefa.cpf_responsavel && (
                  <div className="agendaEventoResponsavel">
                    <span className="agendaEventoResponsavelAvatar">
                      {getNomeFuncionario(tarefa.cpf_responsavel).charAt(0).toUpperCase()}
                    </span>
                    <span>{getNomeFuncionario(tarefa.cpf_responsavel)}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Legenda */}
        <div className="agendaLegenda">
          <span className="agendaLegendaItem">
            <span className="agendaLegendaDot" style={{ background: "#E24B4A" }} /> Alta
          </span>
          <span className="agendaLegendaItem">
            <span className="agendaLegendaDot" style={{ background: "#EF9F27" }} /> Média
          </span>
          <span className="agendaLegendaItem">
            <span className="agendaLegendaDot" style={{ background: "#1D9E75" }} /> Baixa
          </span>
        </div>
      </div>
    </main>
  );
}

export default Agenda;