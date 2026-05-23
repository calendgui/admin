import { login } from "../config/auth.js";

export function renderLogin() {
  return `
    <div class="login-wrapper">
      <section class="login-card">
        <div class="login-brand">Admin Panel</div>
        <h1>Bienvenido</h1>
        <p>Accede con tu cuenta de Google para continuar.</p>

        <button id="btn-login" class="google-login-btn">Continuar con Google</button>

        <small>Solo usuarios autorizados</small>
      </section>
    </div>
  `;
}

export function initLogin(rerender) {
  const btn = document.getElementById("btn-login");

  btn.addEventListener("click", async () => {
    try {
      await login(); 
      // NO necesitas guardar token ni user manualmente
      // Firebase dispara onAuthStateChanged automáticamente
    } catch (err) {
      console.error(err);
    }
  });
}
