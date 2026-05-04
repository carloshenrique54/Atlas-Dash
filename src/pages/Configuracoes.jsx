import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faMoon, faTableCellsLarge, faLanguage,
  faBell, faEnvelope, faVolumeHigh, faDesktop,
  faShield, faLock, faKey, faChevronRight, faArrowRightFromBracket
} from "@fortawesome/free-solid-svg-icons"
import "../styles/Configuracoes.css"

// ── Helper para ler/salvar preferências no localStorage ──────────────
function usePref(chave, padrao) {
  const [valor, setValor] = useState(() => {
    try {
      const salvo = localStorage.getItem(`cfg_${chave}`)
      return salvo !== null ? JSON.parse(salvo) : padrao
    } catch {
      return padrao
    }
  })

  function atualizar(novoValor) {
    setValor(novoValor)
    localStorage.setItem(`cfg_${chave}`, JSON.stringify(novoValor))
  }

  return [valor, atualizar]
}

function Toggle({ value, onChange }) {
  return (
    <button
      className={`cfgToggle ${value ? "cfgToggle--on" : ""}`}
      onClick={() => onChange(!value)}
      type="button"
      aria-label="toggle"
    >
      <span className="cfgToggleThumb" />
    </button>
  )
}

function ConfigItem({ icon, iconCor, titulo, subtitulo, children }) {
  return (
    <div className="cfgItem">
      <div className="cfgItemEsq">
        <div className={`cfgItemIcone cfgItemIcone--${iconCor}`}>
          <FontAwesomeIcon icon={icon} />
        </div>
        <div>
          <p className="cfgItemTitulo">{titulo}</p>
          <p className="cfgItemSub">{subtitulo}</p>
        </div>
      </div>
      <div className="cfgItemDir">{children}</div>
    </div>
  )
}

function Configuracoes() {
  const navigate = useNavigate()

  // ── Aparência ─────────────────────────────────────────────────────
  const [modoEscuro,   setModoEscuroRaw]   = usePref("modoEscuro",   false)
  const [modoCompacto, setModoCompactoRaw] = usePref("modoCompacto", false)
  const [idioma,       setIdioma]          = usePref("idioma",       "pt-BR")

  // ── Notificações ──────────────────────────────────────────────────
  const [notifPush,    setNotifPush]    = usePref("notifPush",    true)
  const [notifEmail,   setNotifEmail]   = usePref("notifEmail",   true)
  const [notifSom,     setNotifSom]     = usePref("notifSom",     false)
  const [notifDesktop, setNotifDesktop] = usePref("notifDesktop", true)

  // ── Segurança ─────────────────────────────────────────────────────
  const [auth2fa,    setAuth2fa]    = usePref("auth2fa",    false)
  const [bloqSessao, setBloqSessao] = usePref("bloqSessao", true)

  // Aplica classes de aparência ao montar e sempre que os valores mudarem
  useEffect(() => {
    document.body.classList.toggle("modoEscuro",   modoEscuro)
    document.body.classList.toggle("modoCompacto", modoCompacto)
  }, [modoEscuro, modoCompacto])

  function toggleModoEscuro(val) {
    setModoEscuroRaw(val)
    document.body.classList.toggle("modoEscuro", val)
  }

  function toggleModoCompacto(val) {
    setModoCompactoRaw(val)
    document.body.classList.toggle("modoCompacto", val)
  }

  function realizarLogout(){
    localStorage.clear()
    navigate("/")
    }


  return (
    <div className="cfgPage">
      <h1 className="cfgTituloPage">Configurações</h1>

      <div className="cfgGrid">
        {/* ── Aparência ── */}
        <section className="cfgSecao">
          <h2 className="cfgSecaoTitulo">Aparência</h2>
          <div className="cfgLista">
            <ConfigItem icon={faMoon} iconCor="roxo" titulo="Modo Escuro" subtitulo="Alternar entre tema claro e escuro">
              <Toggle value={modoEscuro} onChange={toggleModoEscuro} />
            </ConfigItem>

            <ConfigItem icon={faTableCellsLarge} iconCor="azul" titulo="Modo Compacto" subtitulo="Reduzir espaçamento para mais conteúdo">
              <Toggle value={modoCompacto} onChange={toggleModoCompacto} />
            </ConfigItem>

            <ConfigItem icon={faLanguage} iconCor="verde" titulo="Idioma" subtitulo="Idioma da interface">
              <select
                className="cfgSelect"
                value={idioma}
                onChange={e => setIdioma(e.target.value)}
              >
                <option value="pt-BR">Português (BR)</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </ConfigItem>
          </div>
        </section>

        {/* ── Notificações ── */}
        <section className="cfgSecao">
          <h2 className="cfgSecaoTitulo">Notificações</h2>
          <div className="cfgLista">
            <ConfigItem icon={faBell} iconCor="azul" titulo="Notificações Push" subtitulo="Receber notificações push no app">
              <Toggle value={notifPush} onChange={setNotifPush} />
            </ConfigItem>

            <ConfigItem icon={faEnvelope} iconCor="verde" titulo="Notificações por E-mail" subtitulo="Receber atualizações por e-mail sobre tarefas">
              <Toggle value={notifEmail} onChange={setNotifEmail} />
            </ConfigItem>

            <ConfigItem icon={faVolumeHigh} iconCor="laranja" titulo="Sons de Notificação" subtitulo="Tocar som ao receber notificações">
              <Toggle value={notifSom} onChange={setNotifSom} />
            </ConfigItem>

            <ConfigItem icon={faDesktop} iconCor="cinza" titulo="Notificações Desktop" subtitulo="Exibir alertas na área de trabalho">
              <Toggle value={notifDesktop} onChange={setNotifDesktop} />
            </ConfigItem>
          </div>
        </section>

        {/* ── Segurança ── */}
        <section className="cfgSecao">
          <h2 className="cfgSecaoTitulo">Segurança</h2>
          <div className="cfgLista">
            <ConfigItem icon={faShield} iconCor="vermelho" titulo="Autenticação de 2 Fatores" subtitulo="Adicionar camada extra de segurança">
              <Toggle value={auth2fa} onChange={setAuth2fa} />
            </ConfigItem>

            <ConfigItem icon={faLock} iconCor="laranja" titulo="Bloqueio de Sessão" subtitulo="Bloquear após 15 min de inatividade">
              <Toggle value={bloqSessao} onChange={setBloqSessao} />
            </ConfigItem>

            <ConfigItem icon={faKey} iconCor="cinza" titulo="Alterar Senha" subtitulo="Atualizar sua senha de acesso">
              <button className="cfgLinkBtn" onClick={() => navigate("/redefinirsenha")}>
                Alterar <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 10 }} />
              </button>
            </ConfigItem>
            <ConfigItem icon={faArrowRightFromBracket} iconCor="vermelho" titulo="Fazer logout" subtitulo="Sair da sua conta">
              <button className="cfgLinkBtn" onClick={realizarLogout}>
                Sair <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 10 }} />
              </button>
            </ConfigItem>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Configuracoes