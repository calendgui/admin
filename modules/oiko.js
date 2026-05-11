import { BASE_URL } from "../config/config.js";

export function render() {
  return `
    <div class="module-view">
      <h2>Health Check</h2>
      <div id="status">Comprobando...</div>
    </div>
  `;
}

export async function init(container) {
  const status = container.querySelector("#status");

  try {
    const res  = await fetch(`${BASE_URL}/oiko`);
    const data = await res.json();
    status.innerHTML = `<p>✅ ${data.status}</p>`;
  } catch (e) {
    status.innerHTML = `<p>❌ Error al conectar con el servidor</p>`;
  }
}