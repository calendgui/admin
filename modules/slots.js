import { BASE_URL } from "../config/config.js";

const API = `${BASE_URL}/slots/adminslots`;
const API_CHALLENGES = `${BASE_URL}/challenges`;
const API_USERS = `${BASE_URL}/users`;

export function render() {
  return `
    <div class="module-view slots-view">
      <div class="module-header">
        <h2>Slots</h2>
      </div>

      <div id="form-panel" class="slots-filters">
        <div class="slots-filter-grid">
          <label>
            Año
            <input id="field-anho" type="number" min="2020" placeholder="2026" />
          </label>

          <label>
            Mes
            <select id="field-mes">
              <option value="1">Enero</option>
              <option value="2">Febrero</option>
              <option value="3">Marzo</option>
              <option value="4">Abril</option>
              <option value="5">Mayo</option>
              <option value="6">Junio</option>
              <option value="7">Julio</option>
              <option value="8">Agosto</option>
              <option value="9">Septiembre</option>
              <option value="10">Octubre</option>
              <option value="11">Noviembre</option>
              <option value="12">Diciembre</option>
            </select>
          </label>

          <label>
            Batch
            <input id="field-batch" type="number" min="1" placeholder="5" />
          </label>

          <label>
            Challenge
            <select id="field-challenge">
              <option value="">Todos</option>
            </select>
          </label>

          <label>
            Evaluado
            <select id="field-evaluado-nombre">
              <option value="">Todos</option>
            </select>
          </label>

          <label>
            Estado
            <select id="field-estado">
              <option value="">Todos</option>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </label>

          <label>
            Tipo
            <input id="field-type" placeholder="Evaluacion" />
          </label>

          <label>
            Supervisor
            <input id="field-nombre-supervisor" placeholder="Cecilia Reyes" />
          </label>
        </div>

        <button id="btn-filter">Filtrar</button>
      </div>

      <div id="slots-status" class="slots-status">Usa los filtros y presiona Filtrar para consultar slots.</div>
      <div id="slots-list"></div>
    </div>
  `;
}

export async function init(container) {
  const challengeSelect = container.querySelector("#field-challenge");
  const evaluadoSelect = container.querySelector("#field-evaluado-nombre");
  const filterButton = container.querySelector("#btn-filter");
  const status = container.querySelector("#slots-status");
  const list = container.querySelector("#slots-list");

  const fields = {
    anho: container.querySelector("#field-anho"),
    mes: container.querySelector("#field-mes"),
    batch: container.querySelector("#field-batch"),
    challenge: challengeSelect,
    evaluado_nombre: evaluadoSelect,
    estado: container.querySelector("#field-estado"),
    type: container.querySelector("#field-type"),
    nombre_supervisor: container.querySelector("#field-nombre-supervisor"),
  };

  filterButton.addEventListener("click", fetchSlots);

  await loadFilterOptions();

  async function loadFilterOptions() {
    try {
      const [challengesRes, usersRes] = await Promise.all([
        fetch(API_CHALLENGES),
        fetch(API_USERS),
      ]);

      if (!challengesRes.ok || !usersRes.ok) {
        throw new Error("No se pudieron cargar los filtros");
      }

      const [challenges, users] = await Promise.all([
        challengesRes.json(),
        usersRes.json(),
      ]);

      renderChallengeOptions(challenges);
      renderUserOptions(users);
    } catch (err) {
      console.error(err);
      status.textContent =
        "No se pudieron cargar los filtros. Puedes intentar filtrar manualmente más tarde.";
    }
  }

  function renderChallengeOptions(challenges) {
    const sorted = [...challenges].sort((a, b) => Number(a.id) - Number(b.id));

    challengeSelect.innerHTML = `
      <option value="">Todos</option>
      ${sorted
        .map(
          (challenge) => `
        <option value="${escapeHTML(challenge.id)}">${escapeHTML(challenge.nombre ?? "")}</option>
      `,
        )
        .join("")}
    `;
  }

  function renderUserOptions(users) {
    const names = [
      ...new Set(users.map((user) => user.nombre).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b, "es"));

    evaluadoSelect.innerHTML = `
      <option value="">Todos</option>
      ${names.map((name) => `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`).join("")}
    `;
  }

  async function fetchSlots() {
    status.textContent = "Cargando slots...";
    list.innerHTML = "";
    filterButton.disabled = true;

    try {
      const url = buildSlotsUrl();
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error("Error al consultar slots");
      }

      const data = await res.json();
      renderSlots(data);
    } catch (err) {
      console.error(err);
      status.textContent = "Error al consultar slots.";
    } finally {
      filterButton.disabled = false;
    }
  }

  function buildSlotsUrl() {
    const params = new URLSearchParams();

    Object.entries(fields).forEach(([name, field]) => {
      const value = field.value.trim();
      if (value) params.set(name, value);
    });

    const query = params.toString();
    return query ? `${API}?${query}` : API;
  }

  function renderSlots(data) {
    const total = Number(data.total ?? data.slots?.length ?? 0);
    const slots = Array.isArray(data.slots) ? data.slots : [];

    status.textContent = `${total} slot${total === 1 ? "" : "s"} encontrado${total === 1 ? "" : "s"}`;

    if (!slots.length) {
      list.innerHTML = "<p>No hay slots para los filtros seleccionados.</p>";
      return;
    }

    list.innerHTML = slots
      .map(
        (slot) => `
      <div class="list-item slot-item">
        <div class="slot-main">
          <strong>${escapeHTML(slot.fecha ?? "")} · ${escapeHTML(slot.hora ?? "")}</strong>
          <span>${escapeHTML(slot.type ?? "Sin tipo")} · ${escapeHTML(String(slot.duracion ?? ""))} min</span>
          <small>Evaluado: ${escapeHTML(slot.evaluado_nombre ?? "Sin nombre")}</small>
          <small>Supervisor: ${escapeHTML(slot.nombre_supervisor ?? "Sin supervisor")}</small>
        </div>
        <div class="slot-meta">
          <span>Batch ${escapeHTML(String(slot.batch ?? "-"))}</span>
          <span>Challenge ${escapeHTML(String(slot.challenge ?? "-"))}</span>
          <span class="${slot.estado ? "slot-status-active" : "slot-status-inactive"}">
            ${slot.estado ? "Activo" : "Inactivo"}
          </span>
        </div>
      </div>
    `,
      )
      .join("");
  }
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
