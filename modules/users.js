import { getToken } from "../config/auth.js";
import { BASE_URL } from "../config/config.js";

const API = `${BASE_URL}/users`;

const ROL_LABELS = {
  1: "Usuario",
  2: "Supervisor",
  3: "Admin",
};

export function render() {
  return `
    <div class="module-view">
      <div class="module-header">
        <h2>Usuarios</h2>
      </div>

      <!-- FILTROS -->
      <div class="users-filters">
        <div class="users-filter-grid">
          <label>
            Nombre
            <input id="filter-nombre" list="users-name-list" placeholder="Buscar por nombre" />
            <datalist id="users-name-list"></datalist>
          </label>

          <label>
            Email
            <input id="filter-email" list="users-email-list" placeholder="Buscar por email" />
            <datalist id="users-email-list"></datalist>
          </label>

          <label>
            Rol
            <select id="filter-rol">
              <option value="">Todos</option>
              <option value="1">Usuario</option>
              <option value="2">Supervisor</option>
              <option value="3">Admin</option>
            </select>
          </label>

          <label>
            Batch
            <input id="filter-batch" type="number" min="1" placeholder="5" />
          </label>
        </div>
      </div>

      <div id="users-summary" class="users-summary"></div>

      <!-- LISTADO -->
      <div id="list">Cargando...</div>

      <!-- PANEL EDITAR ROL -->
      <div id="form-panel" style="display:none;">
        <hr />
        <h3>Editar rol — <span id="form-email"></span></h3>
        <select id="field-rol">
          <option value="1">Usuario</option>
          <option value="2">Supervisor</option>
          <option value="3">Admin</option>
        </select>
        <div>
          <button id="btn-save">Guardar</button>
          <button id="btn-cancel">Cancelar</button>
        </div>
      </div>
    </div>
  `;
}

export async function init(container) {
  const list = container.querySelector("#list");
  const formPanel = container.querySelector("#form-panel");
  const formEmail = container.querySelector("#form-email");
  const rolSelect = container.querySelector("#field-rol");
  const summary = container.querySelector("#users-summary");
  const nameList = container.querySelector("#users-name-list");
  const emailList = container.querySelector("#users-email-list");
  const filterFields = [...container.querySelectorAll(".users-filter-grid input, .users-filter-grid select")];
  const filters = {
    nombre: container.querySelector("#filter-nombre"),
    email: container.querySelector("#filter-email"),
    rol: container.querySelector("#filter-rol"),
    batch: container.querySelector("#filter-batch"),
  };

  let editingUid = null;
  let allUsers = [];

  filterFields.forEach((field) => {
    field.addEventListener("input", applyFilters);
    field.addEventListener("change", applyFilters);
  });

  // ─── helpers ────────────────────────────────────────────
  function showForm(user) {
    editingUid = user.uid;
    formEmail.textContent = user.nombre ?? user.email ?? user.uid;
    rolSelect.value = user.rol ?? 1;
    formPanel.style.display = "block";
    formPanel.scrollIntoView({ behavior: "smooth" });
  }

  function hideForm() {
    formPanel.style.display = "none";
    editingUid = null;
  }

  async function fetchAll() {
    list.innerHTML = "Cargando...";
    const token = await getToken();
    const res = await fetch(API, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    allUsers = data;
    renderFilterOptions(allUsers);
    applyFilters();
  }

  function renderFilterOptions(users) {
    const names = [...new Set(users.map((user) => user.nombre).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "es"));
    const emails = [...new Set(users.map((user) => user.email).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "es"));

    nameList.innerHTML = names.map((name) => `<option value="${escapeHTML(name)}"></option>`).join("");
    emailList.innerHTML = emails.map((email) => `<option value="${escapeHTML(email)}"></option>`).join("");
  }

  function applyFilters() {
    filterFields.forEach(updateFilterState);

    const nombre = filters.nombre.value.trim().toLowerCase();
    const email = filters.email.value.trim().toLowerCase();
    const rol = filters.rol.value;
    const batch = filters.batch.value.trim();

    const filtered = allUsers.filter((user) => {
      const matchesName = !nombre || (user.nombre ?? "").toLowerCase().includes(nombre);
      const matchesEmail = !email || (user.email ?? "").toLowerCase().includes(email);
      const matchesRol = !rol || String(user.rol ?? "") === rol;
      const matchesBatch = !batch || String(user.batch ?? "") === batch;

      return matchesName && matchesEmail && matchesRol && matchesBatch;
    });

    renderList(filtered);
    summary.textContent = `${filtered.length} de ${allUsers.length} usuario${allUsers.length === 1 ? "" : "s"}`;
  }

  function updateFilterState(field) {
    field.classList.toggle("is-filled", Boolean(field.value.trim()));
  }

  function renderList(items) {
    if (!items.length) {
      list.innerHTML = "<p>No hay usuarios.</p>";
      return;
    }

    list.innerHTML = items
      .map(
        (u) => `
      <div class="list-item" data-uid="${u.uid}">
        <div class="user-info">
          <span>${u.nombre ?? "—"} <small>${u.email ?? ""}</small></span>
          <small>
            ${ROL_LABELS[u.rol] ?? "Sin rol"}
            ${u.ci ? `· CI: ${u.ci}` : ""}
            ${u.batch ? `· Batch: ${u.batch}` : ""}
          </small>
        </div>
        <div>
          <button class="btn-edit-rol" data-uid="${u.uid}" data-email="${u.email ?? ""}" data-nombre="${u.nombre ?? ""}" data-rol="${u.rol ?? 1}">Rol</button>
          <button class="btn-delete"   data-uid="${u.uid}" data-email="${u.email ?? u.uid}">Borrar</button>
        </div>
      </div>
    `,
      )
      .join("");

    // EDIT ROL
    list.querySelectorAll(".btn-edit-rol").forEach((btn) => {
      btn.addEventListener("click", () => {
        showForm({
          uid: btn.dataset.uid,
          email: btn.dataset.email,
          rol: Number(btn.dataset.rol),
        });
      });
    });

    // DELETE
    list.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm(`¿Eliminar usuario "${btn.dataset.email}"?`)) return;
        const token = await getToken();
        const res = await fetch(`${API}/${btn.dataset.uid}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          btn.closest(".list-item").remove();
          if (editingUid === btn.dataset.uid) hideForm();
        } else {
          alert("Error al eliminar usuario");
        }
      });
    });
  }

  // ─── cancelar ───────────────────────────────────────────
  container.querySelector("#btn-cancel").addEventListener("click", hideForm);

  // ─── guardar rol ────────────────────────────────────────
  container.querySelector("#btn-save").addEventListener("click", async () => {
    const rol = Number(rolSelect.value);
    const token = await getToken();
    const res = await fetch(`${API}/${editingUid}/rol`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ rol }),
    });
    if (res.ok) {
      hideForm();
      await fetchAll();
    } else alert("Error al actualizar rol");
  });

  // ─── carga inicial ───────────────────────────────────────
  await fetchAll();
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
