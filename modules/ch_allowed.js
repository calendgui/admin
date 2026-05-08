import { getToken } from "../config/auth.js";
import { BASE_URL } from "../config/config.js";

const API = `${BASE_URL}/ch-allowed`;
const API_CHALLENGES = `${BASE_URL}/challenges`;

export function render() {
  return `
    <div class="module-view">
      <div class="module-header">
        <h2>CH Allowed</h2>
      </div>

      <!-- LISTA DE SUPERVISORES -->
      <div id="supervisores-list">Cargando supervisores...</div>

      <!-- PANEL DE CHALLENGES DEL SUPERVISOR SELECCIONADO -->
      <div id="supervisor-panel" style="display:none;">
        <hr />
        <h3>Challenges habilitados para: <span id="supervisor-nombre"></span></h3>

        <div id="challenges-list">Cargando...</div>
        <button id="btn-guardar" style="display:none;">Guardar cambios</button>
      </div>
    </div>
  `;
}

export async function init(container) {
  const supervisoresList = container.querySelector("#supervisores-list");
  const supervisorPanel  = container.querySelector("#supervisor-panel");
  const supervisorNombre = container.querySelector("#supervisor-nombre");
  const challengesList   = container.querySelector("#challenges-list");
  const btnGuardar       = container.querySelector("#btn-guardar");

  let selectedUid = null;

  async function fetchYRenderChallenges(uid) {
    challengesList.innerHTML = "Cargando...";
    btnGuardar.style.display = "none";

    const token = await getToken();

    const [resTodos, resHabilitados] = await Promise.all([
      fetch(API_CHALLENGES, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API}/${uid}`,  { headers: { Authorization: `Bearer ${token}` } })
    ]);

    const todos      = await resTodos.json();
    const habilitados = await resHabilitados.json();
    const idsHabilitados = new Set(habilitados.map(c => String(c.id)));

    todos.sort((a, b) => Number(a.id) - Number(b.id));

    challengesList.innerHTML = todos.map(c => `
      <label class="list-item" style="cursor:pointer;">
        <input type="checkbox" value="${c.id}" ${idsHabilitados.has(String(c.id)) ? "checked" : ""} />
        <span>${c.id} — ${c.etapa} — ${c.nombre}</span>
      </label>
    `).join("");

    btnGuardar.style.display = "block";
  }

  // ─── cargar supervisores ────────────────────────────────
  async function fetchSupervisores() {
    supervisoresList.innerHTML = "Cargando supervisores...";
    const token = await getToken();
    const res = await fetch(`${API}/supervisores`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    renderSupervisores(data);
  }

  function renderSupervisores(items) {
    if (!items.length) {
      supervisoresList.innerHTML = "<p>No hay supervisores.</p>";
      return;
    }

    supervisoresList.innerHTML = items.map(u => `
      <div class="list-item">
        <span>${u.nombre}</span>
        <button class="btn-select" data-uid="${u.uid}" data-nombre="${u.nombre}">Gestionar</button>
      </div>
    `).join("");

    supervisoresList.querySelectorAll(".btn-select").forEach(btn => {
      btn.addEventListener("click", async () => {
        selectedUid = btn.dataset.uid;
        supervisorNombre.textContent = btn.dataset.nombre;
        supervisorPanel.style.display = "block";
        await fetchYRenderChallenges(selectedUid);
      });
    });
  }

  // ─── agregar challenge ──────────────────────────────────
  container.querySelector("#btn-guardar").addEventListener("click", async () => {
    const checks = [...challengesList.querySelectorAll("input[type=checkbox]:checked")];
    const id_challenges = checks.map(cb => cb.value);

    const token = await getToken();
    const res = await fetch(`${API}/${selectedUid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id_challenges })
    });

    if (res.ok) alert("Guardado ✔");
    else alert("Error al guardar");
  });

  // ─── carga inicial ───────────────────────────────────────
  await fetchSupervisores();
}