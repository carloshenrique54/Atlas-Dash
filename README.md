# Atlas-Dash

[![React](https://img.shields.io/badge/react-19-brightgreen)](https://reactjs.org/)
[![JavaScript](https://img.shields.io/badge/javascript-ES6-yellow)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Supabase](https://img.shields.io/badge/supabase-backend-darkgreen)](https://supabase.com/)
[![Vite](https://img.shields.io/badge/vite-build-purple)](https://vitejs.dev/)

## Descrição do Projeto

O Atlas-Dash é o dashboard interno da plataforma **Atlas**. Enquanto o [Atlas](https://github.com/carloshenrique54/Atlas) é o site institucional que apresenta e direciona o usuário para a aplicação, o Atlas-Dash é onde a gestão de fato acontece — tarefas, equipes e acompanhamento operacional para empresas e startups.

A plataforma oferece dois perfis de acesso:

- **Dono** — cria tarefas, gerencia equipe e visualiza todos os registros
- **Funcionário** — visualiza apenas as tarefas atribuídas ao seu CPF

## Funcionalidades

- Login separado para dono e funcionário
- Dashboard pós-autenticação
- Criação de tarefas e subtarefas (dono apenas)
- Listagem de tarefas com filtros (pendentes, concluídas, etc.)
- Restrição de visualização por funcionário (filtro por CPF)
- Sidebar de navegação com múltiplos módulos

## Tecnologias Utilizadas

| Tecnologia       | Versão   |
|------------------|----------|
| React            | 19       |
| Vite             | latest   |
| React Router DOM | latest   |
| Supabase JS      | latest   |
| FontAwesome      | latest   |
| React Calendar   | latest   |

## Como Usar

1. Clone o repositório:

```
git clone https://github.com/carloshenrique54/Atlas-Dash.git
```

2. Navegue até a pasta do projeto:

```
cd Atlas-Dash
```

3. Instale as dependências:

```
npm install
```

4. Configure o Supabase em `src/services/supabase.jsx`:

```js
const supabaseUrl = 'SUA_URL_SUPABASE'
const supabaseKey = 'SUA_CHAVE_PUBLICA'
```

5. Inicie o servidor de desenvolvimento:

```
npm run dev
```

6. Para construir a aplicação para produção:

```
npm run build
```

## Estrutura de Pastas

- `src/pages/` - páginas da aplicação (Login, Dashboard, Tarefas, etc.)
- `src/components/` - componentes reutilizáveis (Sidebar, Header)
- `src/services/` - configuração do cliente Supabase
- `public/` - arquivos públicos

## Referências

- [Atlas — Site institucional](https://github.com/carloshenrique54/Atlas)
- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Supabase](https://supabase.com/)
- [React Router](https://reactrouter.com/)
