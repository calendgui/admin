import { getToken } from "../config/auth.js";
import { BASE_URL } from "../config/config.js";

const API            = `${BASE_URL}/admin/adminslots`;
const API_CSV        = `${BASE_URL}/admin/adminslots/csv`;
const API_CHALLENGES = `${BASE_URL}/challenges`;
const API_USERS      = `${BASE_URL}/users`;

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
            <input id="field-fecha-desde" type="text" inputmode="numeric" placeholder="dd/mm/aaaa" />
          </label>
          <label>
            Fecha hasta
            <input id="field-fecha-hasta" type="text" inputmode="numeric" placeholder="dd/mm/aaaa" />
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

      <!-- Overlay mover slot -->
      <div id="mover-overlay" class="slot-overlay hidden">
        <div class="slot-overlay-card">
          <h3>Mover slot</h3>
          <label>
            Fecha
            <input id="mover-fecha" type="date" />
          </label>
          <label>
            Hora
            <input id="mover-hora" type="time" />
          </label>
          <div class="slot-overlay-actions">
            <button id="mover-cancelar">Cancelar</button>
            <button id="mover-confirmar">Confirmar</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function init(container) {
  const challengeSelect = container.querySelector("#field-challenge");
  const evaluadosList   = container.querySelector("#evaluados-list");
  const filterButton    = container.querySelector("#btn-filter");
  const downloadButton  = container.querySelector("#btn-download-csv");
  const status          = container.querySelector("#slots-status");
  const list            = container.querySelector("#slots-list");
  const filterFields    = [...container.querySelectorAll(".slots-filter-grid input, .slots-filter-grid select")];

  const overlay         = container.querySelector("#mover-overlay");
  const moverFecha      = container.querySelector("#mover-fecha");
  const moverHora       = container.querySelector("#mover-hora");
  const moverCancelar   = container.querySelector("#mover-cancelar");
  const moverConfirmar  = container.querySelector("#mover-confirmar");

  let pendingMoverId = null;

  const fields = {
    anho:              container.querySelector("#field-anho"),
    mes:               container.querySelector("#field-mes"),
    fecha_desde:       container.querySelector("#field-fecha-desde"),
    fecha_hasta:       container.querySelector("#field-fecha-hasta"),
    batch:             container.querySelector("#field-batch"),
    challenge:         challengeSelect,
    evaluado_nombre:   container.querySelector("#field-evaluado-nombre"),
    estado:            container.querySelector("#field-estado"),
    type:              container.querySelector("#field-type"),
    nombre_supervisor: container.querySelector("#field-nombre-supervisor"),
  };

  filterButton.addEventListener("click", fetchSlots);
  downloadButton.addEventListener("click", downloadCsv);
  filterFields.forEach((field) => {
    field.addEventListener("input",  () => updateFilterState(field));
    field.addEventListener("change", () => updateFilterState(field));
    updateFilterState(field);
  });

  // Overlay: cerrar con cancelar o click fuera
  moverCancelar.addEventListener("click", closeOverlay);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeOverlay();
  });

  moverConfirmar.addEventListener("click", async () => {
    const fecha = moverFecha.value;
    const hora  = moverHora.value;

    if (!fecha || !hora) {
      moverFecha.classList.toggle("input-error", !fecha);
      moverHora.classList.toggle("input-error",  !hora);
      return;
    }

    moverConfirmar.disabled = true;
    moverConfirmar.textContent = "Moviendo...";

    try {
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/admin/mover-slots/${pendingMoverId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fecha, hora }),
      });
      if (!res.ok) throw new Error();
      closeOverlay();
      status.textContent = "Slot movido.";
      await fetchSlots();
    } catch {
      status.textContent = "Error al mover el slot.";
    } finally {
      moverConfirmar.disabled = false;
      moverConfirmar.textContent = "Confirmar";
    }
  });

  await loadFilterOptions();

  // ── Helpers overlay ──────────────────────────────────────────
  function openOverlay(id) {
    pendingMoverId  = id;
    moverFecha.value = "";
    moverHora.value  = "";
    moverFecha.classList.remove("input-error");
    moverHora.classList.remove("input-error");
    overlay.classList.remove("hidden");
  }

  function closeOverlay() {
    overlay.classList.add("hidden");
    pendingMoverId = null;
  }

  // ── Filter options ───────────────────────────────────────────
  async function loadFilterOptions() {
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [challengesRes, usersRes] = await Promise.all([
        fetch(API_CHALLENGES, { headers }),
        fetch(API_USERS,      { headers }),
      ]);

      if (!challengesRes.ok || !usersRes.ok)
        throw new Error("No se pudieron cargar los filtros");

      const [challenges, users] = await Promise.all([
        challengesRes.json(),
        usersRes.json(),
      ]);

      renderChallengeOptions(challenges);
      renderUserOptions(users);
      filterFields.forEach(updateFilterState);
    } catch (err) {
      console.error(err);
      status.textContent = "No se pudieron cargar los filtros. Puedes intentar filtrar manualmente más tarde.";
    }
  }

  function renderChallengeOptions(challenges) {
    const sorted = [...challenges].sort((a, b) => Number(a.id) - Number(b.id));
    challengeSelect.innerHTML = `
      <option value="">Todos</option>
      ${sorted.map(c => `<option value="${escapeHTML(c.id)}">${escapeHTML(c.nombre ?? "")}</option>`).join("")}
    `;
  }

  function renderUserOptions(users) {
    const names = [...new Set(users.map(u => u.nombre).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
    evaluadosList.innerHTML = names.map(n => `<option value="${escapeHTML(n)}">${escapeHTML(n)}</option>`).join("");
  }

  function updateFilterState(field) {
    field.classList.toggle("is-filled", Boolean(field.value.trim()));
  }

  // ── Fetch & render ───────────────────────────────────────────
  async function fetchSlots() {
    status.textContent = "Cargando slots...";
    list.innerHTML = "";
    filterButton.disabled = true;

    try {
      const token = await getToken();
      const url = buildUrl(API);
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

      if (!res.ok) throw new Error("Error al consultar slots");

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
      const token = await getToken();
      const res = await fetch(buildUrl(API_CSV), { headers: { Authorization: `Bearer ${token}` } });

      if (!res.ok) throw new Error("Error al descargar CSV");

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
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
    if ((name === "fecha_desde" || name === "fecha_hasta") && value)
      return formatDateForApi(value);
    return value;
  }

  function formatDateForApi(value) {
    if (value.includes("/")) return value;
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

    list.innerHTML = slots.map(slot => `
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
          <div class="slot-actions">
            <button class="btn-mover" data-id="${escapeHTML(String(slot.id))}">Mover</button>
            ${slot.estado ? `<button class="btn-liberar" data-id="${escapeHTML(String(slot.id))}">Liberar</button>` : ""}
            <button class="btn-eliminar" data-id="${escapeHTML(String(slot.id))}">Eliminar</button>
          </div>
        </div>
      </div>
    `).join("");

    // Listeners por delegación
    list.addEventListener("click", async (e) => {
      const id = e.target.dataset?.id;
      if (!id) return;

      if (e.target.classList.contains("btn-mover")) {
        openOverlay(id);
      }

      if (e.target.classList.contains("btn-liberar")) {
        if (!confirm("¿Liberar este slot?")) return;
        await handleLiberar(id, e.target);
      }

      if (e.target.classList.contains("btn-eliminar")) {
        if (!confirm("¿Eliminar este slot? Esta acción no se puede deshacer.")) return;
        await handleEliminar(id, e.target);
      }
    });
  }

  async function handleLiberar(id, btn) {
    btn.disabled = true;
    status.textContent = "Liberando...";
    try {
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/admin/liberar-slots/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      status.textContent = "Slot liberado.";
      await fetchSlots();
    } catch {
      status.textContent = "Error al liberar el slot.";
      btn.disabled = false;
    }
  }

  async function handleEliminar(id, btn) {
    btn.disabled = true;
    status.textContent = "Eliminando...";
    try {
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/admin/slots/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      status.textContent = "Slot eliminado.";
      await fetchSlots();
    } catch {
      status.textContent = "Error al eliminar el slot.";
      btn.disabled = false;
    }
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