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

        <div id="form-agregar">
          <select id="select-challenge">
            <option value="">-- Seleccionar challenge --</option>
          </select>
          <button id="btn-agregar">Agregar</button>
        </div>

        <div id="challenges-list">Cargando...</div>
      </div>
    </div>
  `;
}

export async function init(container) {
  const supervisoresList  = container.querySelector("#supervisores-list");
  const supervisorPanel   = container.querySelector("#supervisor-panel");
  const supervisorNombre  = container.querySelector("#supervisor-nombre");
  const selectChallenge   = container.querySelector("#select-challenge");
  const challengesList    = container.querySelector("#challenges-list");

  let selectedUid = null;
  let todosLosChallenges = [];

  // ─── cargar todos los challenges disponibles para el select ───
  async function fetchChallengesDisponibles() {
    const token = await getToken();
    const res = await fetch(API_CHALLENGES, {
      headers: { Authorization: `Bearer ${token}` }
    });
    todosLosChallenges = await res.json();

    selectChallenge.innerHTML = `<option value="">-- Seleccionar challenge --</option>` +
      todosLosChallenges.map(c => `<option value="${c.id}">${c.nombre}</option>`).join("");
  }

  // ─── cargar challenges habilitados del supervisor seleccionado ───
  async function fetchChallowedDeSupervisor(uid) {
    challengesList.innerHTML = "Cargando...";
    const token = await getToken();
    const res = await fetch(`${API}/${uid}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    renderChallengesList(data);
  }

  function renderChallengesList(items) {
    if (!items.length) {
      challengesList.innerHTML = "<p>Sin challenges habilitados.</p>";
      return;
    }

    challengesList.innerHTML = items.map(c => `
      <div class="list-item" data-id="${c.id}">
        <span>${c.nombre}</span>
        <button class="btn-quitar" data-id="${Number(c.id)}">Quitar</button>
      </div>
    `).join("");

    challengesList.querySelectorAll(".btn-quitar").forEach(btn => {
      btn.addEventListener("click", async () => {
        const token = await getToken();
        const res = await fetch(`${API}/${selectedUid}/quitar`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id_challenge: btn.dataset.id })
        });
        if (res.ok) {
          btn.closest(".list-item").remove();
        } else {
          alert("Error al quitar challenge");
        }
      });
    });
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
        await fetchChallowedDeSupervisor(selectedUid);
      });
    });
  }

  // ─── agregar challenge ──────────────────────────────────
  container.querySelector("#btn-agregar").addEventListener("click", async () => {
    const id_challenge = Number(selectChallenge.value);
    if (!id_challenge) { alert("Seleccioná un challenge"); return; }

    // traer los actuales y agregar el nuevo
    const token = await getToken();
    const resActuales = await fetch(`${API}/${selectedUid}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const actuales = await resActuales.json();
    const ids = actuales.map(c => Number(c.id));

    if (ids.includes(id_challenge)) { alert("Ya está habilitado"); return; }

    const res = await fetch(`${API}/${selectedUid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id_challenges: [...ids, id_challenge] })
    });

    if (res.ok) {
      await fetchChallowedDeSupervisor(selectedUid);
    } else {
      alert("Error al agregar challenge");
    }
  });

  // ─── carga inicial ───────────────────────────────────────
  await fetchChallengesDisponibles();
  await fetchSupervisores();
}