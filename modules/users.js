import { getToken } from "../config/auth.js";
import { BASE_URL } from "../config/config.js";

const API = `${BASE_URL}/users`;

const ROL_LABELS = {
  1: "Usuario",
  2: "Supervisor",
  3: "Admin"
};

export function render() {
  return `
    <div class="module-view">
      <div class="module-header">
        <h2>Users</h2>
      </div>

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
  const list      = container.querySelector("#list");
  const formPanel = container.querySelector("#form-panel");
  const formEmail = container.querySelector("#form-email");
  const rolSelect = container.querySelector("#field-rol");

  let editingUid = null;

  // ─── helpers ────────────────────────────────────────────
  function showForm(user) {
    editingUid            = user.uid;
    formEmail.textContent = user.email ?? user.uid;
    rolSelect.value       = user.rol ?? 1;
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
    const res   = await fetch(API, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    renderList(data);
  }

  function renderList(items) {
    if (!items.length) {
      list.innerHTML = "<p>No hay usuarios.</p>";
      return;
    }

    list.innerHTML = items.map(u => `
      <div class="list-item" data-uid="${u.uid}">
        <div>
          <span>${u.email ?? "—"}</span>
          <small style="margin-left:8px;opacity:0.6;">
            ${ROL_LABELS[u.rol] ?? "Sin rol"}
            ${u.ci    ? `· CI: ${u.ci}`       : ""}
            ${u.batch ? `· Batch: ${u.batch}`  : ""}
          </small>
        </div>
        <div>
          <button class="btn-edit-rol" data-uid="${u.uid}" data-email="${u.email ?? ""}" data-rol="${u.rol ?? 1}">Rol</button>
          <button class="btn-delete"   data-uid="${u.uid}" data-email="${u.email ?? u.uid}">Borrar</button>
        </div>
      </div>
    `).join("");

    // EDIT ROL
    list.querySelectorAll(".btn-edit-rol").forEach(btn => {
      btn.addEventListener("click", () => {
        showForm({ uid: btn.dataset.uid, email: btn.dataset.email, rol: Number(btn.dataset.rol) });
      });
    });

    // DELETE
    list.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm(`¿Eliminar usuario "${btn.dataset.email}"?`)) return;
        const token = await getToken();
        const res = await fetch(`${API}/${btn.dataset.uid}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
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
    const rol   = Number(rolSelect.value);
    const token = await getToken();
    const res   = await fetch(`${API}/${editingUid}/rol`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ rol })
    });
    if (res.ok) { hideForm(); await fetchAll(); }
    else alert("Error al actualizar rol");
  });

  // ─── carga inicial ───────────────────────────────────────
  await fetchAll();
}