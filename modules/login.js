import { login } from "../config/auth.js";

export function renderLogin() {
  return `
    <div class="login-wrapper">
      <h1>Login</h1>
      <button id="btn-login">Login con Google</button>
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