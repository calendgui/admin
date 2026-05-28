import { getToken } from "../config/auth.js";
import { BASE_URL } from "../config/config.js";

const API = `${BASE_URL}/slots/adminslots`;
const API_CSV = `${BASE_URL}/slots/adminslots/csv`;
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
              <option value="">Todos</option>
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
            Fecha desde
            <input id="field-fecha-desde" type="date" />
          </label>

          <label>
            Fecha hasta
            <input id="field-fecha-hasta" type="date" />
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
            <input id="field-evaluado-nombre" list="evaluados-list" placeholder="Buscar por nombre" />
            <datalist id="evaluados-list"></datalist>
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

        <div class="slots-actions">
          <button id="btn-filter">Filtrar</button>
          <button id="btn-download-csv">Descargar CSV</button>
        </div>
      </div>

      <div id="slots-status" class="slots-status">Usa los filtros y presiona Filtrar para consultar slots.</div>
      <div id="slots-list"></div>
    </div>
  `;
}

export async function init(container) {
  const challengeSelect = container.querySelector("#field-challenge");
  const evaluadosList = container.querySelector("#evaluados-list");
  const filterButton = container.querySelector("#btn-filter");
  const downloadButton = container.querySelector("#btn-download-csv");
  const status = container.querySelector("#slots-status");
  const list = container.querySelector("#slots-list");
  const filterFields = [...container.querySelectorAll(".slots-filter-grid input, .slots-filter-grid select")];

  const fields = {
    anho: container.querySelector("#field-anho"),
    mes: container.querySelector("#field-mes"),
    fecha_desde: container.querySelector("#field-fecha-desde"),
    fecha_hasta: container.querySelector("#field-fecha-hasta"),
    batch: container.querySelector("#field-batch"),
    challenge: challengeSelect,
    evaluado_nombre: container.querySelector("#field-evaluado-nombre"),
    estado: container.querySelector("#field-estado"),
    type: container.querySelector("#field-type"),
    nombre_supervisor: container.querySelector("#field-nombre-supervisor"),
  };

  filterButton.addEventListener("click", fetchSlots);
  downloadButton.addEventListener("click", downloadCsv);
  filterFields.forEach((field) => {
    field.addEventListener("input", () => updateFilterState(field));
    field.addEventListener("change", () => updateFilterState(field));
    updateFilterState(field);
  });

  await loadFilterOptions();

  async function loadFilterOptions() {
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [challengesRes, usersRes] = await Promise.all([
        fetch(API_CHALLENGES, { headers }),
        fetch(API_USERS, { headers }),
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
      filterFields.forEach(updateFilterState);
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

    evaluadosList.innerHTML = `
      ${names.map((name) => `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`).join("")}
    `;
  }

  function updateFilterState(field) {
    field.classList.toggle("is-filled", Boolean(field.value.trim()));
  }

  async function fetchSlots() {
    status.textContent = "Cargando slots...";
    list.innerHTML = "";
    filterButton.disabled = true;

    try {
      const url = buildUrl(API);
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

  async function downloadCsv() {
    status.textContent = "Preparando CSV...";
    downloadButton.disabled = true;

    try {
      const res = await fetch(buildUrl(API_CSV));

      if (!res.ok) {
        throw new Error("Error al descargar CSV");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "adminslots.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      status.textContent = "CSV descargado.";
    } catch (err) {
      console.error(err);
      status.textContent = "Error al descargar CSV.";
    } finally {
      downloadButton.disabled = false;
    }
  }

  function buildUrl(baseUrl) {
    const params = new URLSearchParams();

    Object.entries(fields).forEach(([name, field]) => {
      const value = normalizeFilterValue(name, field.value.trim());
      if (value) params.set(name, value);
    });

    const query = params.toString();
    return query ? `${baseUrl}?${query}` : baseUrl;
  }

  function normalizeFilterValue(name, value) {
    if ((name === "fecha_desde" || name === "fecha_hasta") && value) {
      return formatDateForApi(value);
    }

    return value;
  }

  function formatDateForApi(value) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
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
