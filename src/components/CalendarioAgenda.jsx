import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

function CalendarioAgenda({ dataSelecionada, onChange, diasComTarefas = {} }) {

  function tileContent({ date, view }) {
    if (view !== "month") return null;
    const diaStr = date.toISOString().split("T")[0];
    const tarefasDoDia = diasComTarefas[diaStr];
    if (!tarefasDoDia || tarefasDoDia.length === 0) return null;

    // Agrupa por prioridade para mostrar no máximo 3 dots
    const cores = {
      alta: "#E24B4A",
      media: "#EF9F27",
      baixa: "#1D9E75",
    };

    const prioridades = [...new Set(tarefasDoDia.map((t) => t.prioridade))].slice(0, 3);

    return (
      <div className="calDots">
        {prioridades.map((p) => (
          <span
            key={p}
            className="calDot"
            style={{ background: cores[p] || "#888" }}
          />
        ))}
      </div>
    );
  }

  function tileClassName({ date, view }) {
    if (view !== "month") return null;
    const diaStr = date.toISOString().split("T")[0];
    if (diasComTarefas[diaStr]) return "temTarefa";
    return null;
  }

  return (
    <div className="calWrapper">
      <Calendar
        onChange={onChange}
        value={dataSelecionada}
        tileContent={tileContent}
        tileClassName={tileClassName}
        className="AgendaCal"
        locale="pt-BR"
      />
    </div>
  );
}

export default CalendarioAgenda;