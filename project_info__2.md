# Atlas-Dash — Codebase Overview

## Summary
Atlas-Dash is a Vite + React single-page application that uses Supabase as its backend and provides an internal dashboard with login flows for (1) the company/startup owner (“dono”) and (2) employees (“funcionário”). The key feature in this codebase is task management at the `/tarefas` route, including task creation (owner) and restricted viewing for employees (show only their tasks). Authentication is implemented client-side by persisting a `localStorage.usuario` object and using it to parameterize Supabase queries.

## Architecture
**Primary pattern:** React SPA with `react-router-dom` routing and page-level data fetching (no global state container).  
**Runtime entry:** `src/main.jsx` mounts `src/App.jsx` which renders `Routes/Route` for pages.  
**Technology stack:**
- Frontend: React 19 + Vite, CSS modules via plain imported `.css` files
- Routing: `react-router-dom`
- Backend: `@supabase/supabase-js` (single exported client)
- UI libraries: FontAwesome + `react-calendar` (only used on `/tarefas`)

**Execution flow (happy path):**
1. User logs in via `/` or `/loginfuncionario`
2. App stores a user payload into `localStorage.usuario`
3. User navigates to `/dashboard` and then to `/tarefas`
4. `/tarefas` reads `localStorage.usuario` and runs multiple Supabase queries to load:
   - `funcionarios` (list of employees for the “Responsável” select)
   - `tarefas` (task list)
   - `subtarefas` (subtask list, later joined in-memory)

## Directory Structure
```text
project-root/
├── src/
│   ├── App.jsx                  — Router + layout composition
│   ├── MainLayout.jsx           — Sidebar + Outlet layout wrapper (not heavily used by App)
│   ├── services/
│   │   └── supabase.jsx         — Creates and exports Supabase client
│   ├── components/
│   │   ├── Header.jsx           — Header title based on route pathname
│   │   ├── Sidebar.jsx          — Navigation links
│   │   └── CalendarioAgenda.jsx — (agenda-related UI, not analyzed deeply)
│   └── pages/
│       ├── Login.jsx
│       ├── LoginFuncionario.jsx
│       ├── Dashboard.jsx
│       ├── Tarefas.jsx          — Main task logic (creation + listing)
│       ├── Agenda.jsx
│       ├── Projetos.jsx
│       ├── Equipe.jsx
│       ├── Relatorios.jsx
│       ├── Perfil.jsx
│       └── Configuracoes.jsx
└── public/ and build outputs (dist/)
```

## Key Abstractions

### Supabase client (`supabase`)
- **File**: `src/services/supabase.jsx`
- **Responsibility**: Provides a configured Supabase SDK instance used everywhere in the UI.
- **Interface**: `createClient(url, key)` exported as `supabase`.
- **Lifecycle**: Module singleton; created once when imported.
- **Used by**: `Login.jsx`, `LoginFuncionario.jsx`, `Tarefas.jsx`, and potentially other pages.

### Auth payload in `localStorage.usuario`
- **File(s)**:
  - `src/pages/Login.jsx`
  - `src/pages/LoginFuncionario.jsx`
- **Responsibility**: Acts as the only “session” mechanism.
- **Shape (observed)**:
  - Owner (“dono”) login sets: `{ ...usuarioRow, cargo: "dono", empresa_id: <id> }`
  - Employee (“funcionário”) login sets: `{ ...funcionarioRow, cargo: "funcionario", empresa_id: <id>, empresa_id: empresaId }`
- **Lifecycle**: Persisted across refresh; cleared nowhere centrally.
- **Used by**:
  - `src/pages/Tarefas.jsx` to determine employee vs owner and to parameterize queries.
  - `src/pages/Dashboard.jsx` to validate “logged in”.

### `/tarefas` page controller
- **File**: `src/pages/Tarefas.jsx`
- **Responsibility**: Implements:
  - conditional UI: owner can create tasks; employee cannot
  - fetching and joining: tasks + subtasks
  - client-side filtering based on employee identity and UI filters (“pendentes”, etc.)
- **Key internal logic**:
  - `isFuncionario` derived from `localStorage.usuario.cargo === "funcionario"`
  - `CPF` derived from `localStorage.usuario.cpf`
  - Joins tasks and subtasks in memory: `tarefasComSub = tarefasData.map(...filter subtarefasData)`
  - Filters tasks for employees by `cpf_responsavel === CPF`
- **Lifecycle**:
  - Multiple `useEffect` hooks for:
    - `listarFuncionarios()` (employee list for selects)
    - `contarTarefas()` (count for the “Nenhuma tarefa registrada” branch)
    - `listarTarefas()` (load tasks + join subtasks)
- **Used by**: Router via `src/App.jsx` route `/tarefas`.

## Data Flow

1. **Login → session payload**
   - `Login.jsx` (owner): reads `usuarios`, determines `empresaId` from either `empresas` or `startups` using `dono_cpf`, then writes `localStorage.usuario` with `cargo: "dono"` and `empresa_id: empresaId.id`.
   - `LoginFuncionario.jsx` (employee): reads `funcionarios` by email+senha, resolves the company/startup by invite code (`codigoconvite`), validates vínculo via `funcionarios` (matching `empresa_id` or `startup_id`), then writes `localStorage.usuario` with `cargo: "funcionario"` and `empresa_id: empresaId`.

2. **Session payload → `/tarefas` data fetching**
   - `Tarefas.jsx` reads `localStorage.usuario` and derives:
     - `CPF` and `isFuncionario`
     - `idEmpresa = usuarioObj.empresa_id`
   - It runs:
     - Query A: `funcionarios.select("nome, cpf").eq("startup_id", idEmpresa)` (employee list)
     - Query B: `tarefas.select(...).eq("id_startup", idEmpresa)` (count and listing)
     - Query C: `subtarefas.select("*")` (then joined in memory)

3. **Task join & filtering**
   - Join: attach subtasks to each task where `sub.id_tarefa === task.id`.
   - Employee restriction: if `isFuncionario`, filter joined tasks to only those whose `cpf_responsavel === CPF`.
   - UI filters: after employee/owner selection, further filter by `filtro` based on subtasks’ `concluida` state.

4. **Task creation (owner only)**
   - Owner can open the creation form and submit `cadastrarTarefa`.
   - It determines whether the CPF corresponds to a `startups` row or an `empresas` row and sets `idStartup`/`idEmpresaTarefa`.
   - Inserts into `tarefas` with both `id_empresa` and `id_startup` fields (depending on the owner type), then inserts subtasks into `subtarefas`.

## Non-Obvious Behaviors & Design Decisions

### 1) Critical schema mismatch: `empresa_id` is used as `id_startup`
A non-obvious (and likely breaking) decision currently present in `/tarefas`:
- The page uses `idEmpresa = localStorage.usuario.empresa_id`
- It then queries tasks with:
  - `.eq("id_startup", idEmpresa)` for both:
    - counting tasks (`contarTarefas`)
    - listing tasks (`listarTarefas`)
- However, login sets `empresa_id` to **either**:
  - `empresas.id` (when owner is a company owner)
  - `startups.id` (when owner is a startup owner)

**Meaning:** when the logged-in owner belongs to `empresas`, the `/tarefas` page will incorrectly filter by `tarefas.id_startup = empresas.id`, producing an incomplete or empty task list.

This directly matches the user’s report: “in the account that isn’t employee, in `/tarefas` I can’t see all tasks”.

### 2) The same mismatch affects employee selection lists
`listarFuncionarios()` in `/tarefas` always queries:
- `.eq("startup_id", idEmpresa)`

But the database screenshot indicates `funcionarios` contains both:
- `empresa_id`
- `startup_id`

So if `idEmpresa` represents an `empresas.id`, the employee select list will also be incomplete.

### 3) Owner/Employee restriction is correct in spirit, but depends on correct base query
The employee restriction currently works at the UI level:
- It filters tasks where `tarefa.cpf_responsavel === CPF` when `cargo === "funcionario"`

But the restriction only applies to tasks that were already loaded from Supabase. If the base Supabase query is wrong (e.g., using `id_startup` for company tasks), employees will not see their tasks either, because they never arrive in the `tarefasData` result set.

### 4) Task “success toast” logic relies on React state updates
The `/tarefas` success toast was fixed by ensuring the correct state setters are used and that the message is set only after successful inserts. Developers should be careful not to reintroduce mismatches between variable names like `setAbrirToastCerto` vs `setAbrirToastcerto`.

### 5) No server-side authorization
Authorization is purely “best effort” in the frontend:
- employees are filtered client-side by CPF
- creation UI is hidden for employees

There is no mention of Supabase RLS policies in this codebase documentation. If RLS is not configured, employees could potentially query directly if they bypass the UI.

## Module Reference

| File | Purpose |
|---|---|
| `src/services/supabase.jsx` | Supabase SDK client singleton |
| `src/App.jsx` | Routes: maps `/tarefas` to `pages/Tarefas.jsx` and wires global Header/Sidebar rendering |
| `src/pages/Login.jsx` | Owner login; sets `localStorage.usuario` with `cargo:"dono"` and `empresa_id` referencing either `empresas.id` or `startups.id` |
| `src/pages/LoginFuncionario.jsx` | Employee login; sets `localStorage.usuario` with `cargo:"funcionario"` and `empresa_id` referencing either `empresas.id` or `startups.id` |
| `src/pages/Tarefas.jsx` | Task listing + employee restriction + owner task creation + subtasks join |
| `src/components/Sidebar.jsx` | Navigation links |
| `src/components/Header.jsx` | Route-based title rendering |

## Suggested Reading Order

1. `src/pages/Tarefas.jsx`  
   Start here: it contains the full task join/filter/creation logic and the employee restriction behavior.
2. `src/pages/Login.jsx`  
   Learn how `empresa_id` is derived (this is the root of the `id_startup` vs `id_empresa` mismatch).
3. `src/pages/LoginFuncionario.jsx`  
   Confirms how employees set the same `empresa_id` field.
4. `src/services/supabase.jsx`  
   Understand the Supabase client used by all queries.
5. `src/App.jsx`  
   See the routing and layout composition that makes `/tarefas` reachable.

## What a Developer Needs to Know to Work Effectively
- Treat `localStorage.usuario` as the “session source of truth” for this app. Every feature depends on it.
- Be extremely careful about interpreting `usuarioObj.empresa_id`:
  - it can represent either `empresas.id` or `startups.id` depending on how the login resolved the owner.
  - `/tarefas` currently assumes it is always `startups.id` (by filtering tasks with `tarefas.id_startup = idEmpresa`).
- For task visibility correctness, the base task query in `/tarefas` must decide whether to filter by `id_startup` or `id_empresa` using a reliable indicator (not only the numeric id).
- Employee restriction should be applied after the correct base task set is loaded.