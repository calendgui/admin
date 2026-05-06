import { logout, getToken } from "../config/auth.js";

export function renderApp(user) {
  return `
    <div>
      <h1>Bienvenido 👋</h1>
      <p>${user.email}</p>

      <button id="btn-logout">Logout</button>
      <button id="btn-token">Ver token</button>

      <pre id="token-box"></pre>
    </div>
  `;
}

export function initApp(user) {
  const logoutBtn = document.getElementById("btn-logout");
  const tokenBtn = document.getElementById("btn-token");
  const tokenBox = document.getElementById("token-box");

  logoutBtn.addEventListener("click", () => {
    logout();
  });

  tokenBtn.addEventListener("click", async () => {
    try {
      const token = await getToken();
      tokenBox.textContent = token;
    } catch (e) {
      tokenBox.textContent = "No token";
    }
  });
}