// modules/login.js
import { login, logout, onSession } from '../config/auth.js'

// — Estilos propios del módulo
const styles = `
<style>
  .login-layout {
    width: 100%;
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 2rem;
    background:
      radial-gradient(ellipse 60% 50% at 50% 0%, rgba(124, 106, 247, 0.12) 0%, transparent 70%),
      var(--bg);
  }

  .login-card {
    width: 100%;
    max-width: 380px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 2.5rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .login-user {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.65rem 1rem;
    background: rgba(124, 106, 247, 0.08);
    border: 1px solid rgba(124, 106, 247, 0.25);
    border-radius: var(--radius);
    font-size: 13px;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #4ade80;
    flex-shrink: 0;
    box-shadow: 0 0 6px #4ade80;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.5; }
  }
</style>
`

// — HTML del módulo
export function render() {
  return `
    ${styles}
    <div class="login-layout">
      <div class="login-card">

        <div class="login-header">
          <span class="tag">admin panel</span>
          <h1>Bienvenido</h1>
          <p>Iniciá sesión para continuar</p>
        </div>

        <hr class="login-divider">

        <button id="btn-login" class="btn btn--google">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="18" height="18">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 32.6 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.2 2.8l5.7-5.7C33.5 7.1 29 5 24 5 13 5 4 14 4 25s9 20 20 20c11 0 19.4-8 19.4-20 0-1.3-.1-2.7-.4-4l.6-1z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c2.8 0 5.3 1 7.2 2.8l5.7-5.7C33.5 7.1 29 5 24 5 16.3 5 9.7 9 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 45c5 0 9.5-1.9 12.9-5l-6-5c-1.8 1.3-4.1 2-6.9 2-5.2 0-9.5-3.4-11.1-8H6.5C9.9 39.6 16.4 45 24 45z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.2 4-4.1 5.3l6 5C40.8 35.3 44 30.5 44 25c0-1.3-.1-2.7-.4-4z"/>
          </svg>
          Continuar con Google
        </button>

        <div id="login-status" class="login-status"></div>

        <div id="login-user" class="login-user" style="display:none">
          <span class="status-dot"></span>
          <span id="user-email"></span>
        </div>

      </div>
    </div>
  `
}

// — Lógica del módulo
export function init() {
  const btnLogin  = document.getElementById('btn-login')
  const statusEl  = document.getElementById('login-status')
  const userBox   = document.getElementById('login-user')
  const userEmail = document.getElementById('user-email')

  function setStatus(msg, isError = false) {
    statusEl.textContent = msg
    statusEl.className   = 'login-status' + (isError ? ' error' : '')
  }

  onSession(user => {
    if (user) {
      btnLogin.style.display = 'none'
      userBox.style.display  = 'flex'
      userEmail.textContent  = user.email
      setStatus('')
    } else {
      btnLogin.style.display = 'inline-flex'
      userBox.style.display  = 'none'
    }
  })

  btnLogin.addEventListener('click', async () => {
    btnLogin.disabled = true
    setStatus('Conectando...')
    try {
      await login()
    } catch (err) {
      setStatus(err.message, true)
      btnLogin.disabled = false
    }
  })
}