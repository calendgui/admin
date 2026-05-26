// modules/token.js
import { getToken } from "../config/auth.js";

export function render() {
  return `
    <div class="module-view">
      <div class="module-header">
        <h2>Token</h2>
      </div>
      <button id="btn-copiar">Copiar token</button>
      <textarea id="token-area" rows="8" style="width:100%;margin-top:1rem;font-size:0.75rem;" readonly></textarea>
      <p id="token-msg" style="display:none;color:green;">¡Copiado!</p>
    </div>
  `;
}

export async function init(container) {
  const area = container.querySelector("#token-area");
  const msg  = container.querySelector("#token-msg");

  const token = await getToken();
  area.value = token;

  container.querySelector("#btn-copiar").addEventListener("click", () => {
    navigator.clipboard.writeText(token).then(() => {
      msg.style.display = "block";
      setTimeout(() => msg.style.display = "none", 2000);
    });
  });
}