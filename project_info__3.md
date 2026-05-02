✅ Correção aplicada no `src/pages/Tarefas.jsx` para o caso do **usuário não ser funcionário (dono)** não conseguir ver todas as tarefas.

**Motivo:** no banco, o dono pode ter `localStorage.usuario.empresa_id` apontando para **`startups.id` ou `empresas.id`**, mas antes a tela sempre filtrava por **`tarefas.id_startup`**, o que deixava a lista incompleta para donos de empresa.

**O que mudei:**
- A tela agora detecta automaticamente o “escopo” do dono consultando o Supabase:
  - Se `empresa_id` existe em `startups` ⇒ `escopoTarefas = "startup"` e usa `tarefas.id_startup`
  - Se `empresa_id` existe em `empresas` ⇒ `escopoTarefas = "empresa"` e usa `tarefas.id_empresa`
- A listagem de funcionários (select “Responsável”) também passa a usar:
  - `funcionarios.startup_id` no escopo `"startup"`
  - `funcionarios.empresa_id` no escopo `"empresa"`
- A regra de funcionário continua:
  - se `cargo === "funcionario"`, mostra apenas tarefas com `cpf_responsavel === CPF`
  - e não exibe o botão de cadastro de tarefa.

Resultado esperado: na conta “não funcionário”, o botão/filtro “Todas” volta a mostrar o conjunto correto de tarefas.