import { useState } from "react"
import { supabase } from "../services/supabase"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faMoon, faTableCellsLarge, faLanguage,
  faBell, faEnvelope, faVolumeHigh, faDesktop,
  faShield, faLock, faKey, faChevronRight,
} from "@fortawesome/free-solid-svg-icons"
import "../styles/Configuracoes.css"

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
  const usuario    = localStorage.getItem("usuario")
  const usuarioObj = usuario ? JSON.parse(usuario) : null
  const CPF        = usuarioObj?.cpf ?? ""

  // ── Aparência ─────────────────────────────────────────────────────
  const [modoEscuro,    setModoEscuro]    = useState(false)
  const [modoCompacto,  setModoCompacto]  = useState(false)
  const [idioma,        setIdioma]        = useState("pt-BR")

  // ── Notificações ──────────────────────────────────────────────────
  const [notifPush,     setNotifPush]     = useState(true)
  const [notifEmail,    setNotifEmail]    = useState(true)
  const [notifSom,      setNotifSom]      = useState(false)
  const [notifDesktop,  setNotifDesktop]  = useState(true)

  // ── Segurança ─────────────────────────────────────────────────────
  const [auth2fa,       setAuth2fa]       = useState(false)
  const [bloqSessao,    setBloqSessao]    = useState(true)

  // Modal alterar senha
  const [modalSenha,    setModalSenha]    = useState(false)
  const [senhaAtual,    setSenhaAtual]    = useState("")
  const [senhaNova,     setSenhaNova]     = useState("")
  const [senhaConfirm,  setSenhaConfirm]  = useState("")
  const [senhaErro,     setSenhaErro]     = useState("")
  const [senhaOk,       setSenhaOk]       = useState(false)
  const [salvando,      setSalvando]      = useState(false)

  async function alterarSenha(e) {
    e.preventDefault()
    setSenhaErro("")
    if (!senhaAtual || !senhaNova || !senhaConfirm) { setSenhaErro("Preencha todos os campos"); return }
    if (senhaNova !== senhaConfirm) { setSenhaErro("As senhas não coincidem"); return }
    if (senhaNova.length < 6) { setSenhaErro("Mínimo de 6 caracteres"); return }

    setSalvando(true)

    // Verifica senha atual comparando com a do banco (funcionarios ou usuarios)
    const { data: func } = await supabase
      .from("funcionarios").select("senha").eq("cpf", CPF).maybeSingle()

    const tabela  = func ? "funcionarios" : "usuarios"
    const senhaDB = func?.senha

    if (senhaDB !== senhaAtual) {
      setSenhaErro("Senha atual incorreta")
      setSalvando(false)
      return
    }

    await supabase.from(tabela).update({ senha: senhaNova }).eq("cpf", CPF)

    setSenhaOk(true)
    setSalvando(false)
    setTimeout(() => {
      setModalSenha(false)
      setSenhaOk(false)
      setSenhaAtual(""); setSenhaNova(""); setSenhaConfirm("")
    }, 1800)
  }

  // Aplica modo escuro no body (simples)
  function toggleModoEscuro(val) {
    setModoEscuro(val)
    document.body.classList.toggle("modoEscuro", val)
  }

  function toggleModoCompacto(val) {
    setModoCompacto(val)
    document.body.classList.toggle("modoCompacto", val)
  }

  return (
    <div className="cfgPage">

      {/* Modal alterar senha */}
      {modalSenha && (
        <div className="cfgOverlay" onClick={e => { if (e.target===e.currentTarget) setModalSenha(false) }}>
          <form className="cfgModal" onSubmit={alterarSenha}>
            <h3 className="cfgModalTitulo">Alterar Senha</h3>

            {senhaOk ? (
              <div className="cfgSenhaOk">✓ Senha alterada com sucesso!</div>
            ) : (
              <>
                {senhaErro && <p className="cfgSenhaErro">{senhaErro}</p>}

                <label className="cfgLabel">Senha atual</label>
                <input
                  type="password"
                  className="cfgInput"
                  value={senhaAtual}
                  onChange={e => setSenhaAtual(e.target.value)}
                  placeholder="••••••••"
                />

                <label className="cfgLabel">Nova senha</label>
                <input
                  type="password"
                  className="cfgInput"
                  value={senhaNova}
                  onChange={e => setSenhaNova(e.target.value)}
                  placeholder="••••••••"
                />

                <label className="cfgLabel">Confirmar nova senha</label>
                <input
                  type="password"
                  className="cfgInput"
                  value={senhaConfirm}
                  onChange={e => setSenhaConfirm(e.target.value)}
                  placeholder="••••••••"
                />

                <div className="cfgModalBotoes">
                  <button type="submit" className="cfgBotaoSalvar" disabled={salvando}>
                    {salvando ? "Salvando..." : "Alterar senha"}
                  </button>
                  <button type="button" className="cfgBotaoCancelar" onClick={() => setModalSenha(false)}>
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}

      <h1 className="cfgTituloPage">Configurações</h1>

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
            <button className="cfgLinkBtn" onClick={() => setModalSenha(true)}>
              Alterar <FontAwesomeIcon icon={faChevronRight} style={{ fontSize:10 }} />
            </button>
          </ConfigItem>
        </div>
      </section>
    </div>
  )
}

export default Configuracoes