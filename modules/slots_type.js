import { getToken } from "../config/auth.js";
import { BASE_URL } from "../config/config.js";

const API = `${BASE_URL}/slots-type`;

export function render() {
  return `
    <div class="module-view">
      <div class="module-header">
        <h2>Slots Type</h2>
        <button id="btn-new">+ Nuevo</button>
      </div>

      <!-- FORM -->
      <div id="form-panel" style="display:none;">
        <h3 id="form-title">Crear Slot Type</h3>
        <input id="field-nombre"   placeholder="Nombre" />
        <input id="field-duracion" placeholder="Duración (min)" type="number" min="1" />
        <div>
          <button id="btn-save">Guardar</button>
          <button id="btn-cancel">Cancelar</button>
        </div>
      </div>

      <hr />

      <!-- LISTADO -->
      <div id="list">Cargando...</div>
    </div>
  `;
}

export async function init(container) {
  const list          = container.querySelector("#list");
  const formPanel     = container.querySelector("#form-panel");
  const formTitle     = container.querySelector("#form-title");
  const nameInput     = container.querySelector("#field-nombre");
  const duracionInput = container.querySelector("#field-duracion");

  let editingId = null;

  // ─── helpers ────────────────────────────────────────────
  function showForm(mode = "create", data = {}) {
    editingId             = mode === "edit" ? data.id : null;
    formTitle.textContent = mode === "edit" ? "Editar Slot Type" : "Crear Slot Type";
    nameInput.value       = data.nombre   ?? "";
    duracionInput.value   = data.duracion ?? "";
    formPanel.style.display = "block";
    nameInput.focus();
  }

  function hideForm() {
    formPanel.style.display = "none";
    editingId           = null;
    nameInput.value     = "";
    duracionInput.value = "";
  }

  async function fetchAll() {
    list.innerHTML = "Cargando...";
    // GET sin token según la doc
    const res  = await fetch(API);
    const data = await res.json();
    renderList(data);
  }

  function renderList(items) {
    if (!items.length) {
      list.innerHTML = "<p>No hay slot types.</p>";
      return;
    }

    list.innerHTML = items.map(s => `
      <div class="list-item" data-id="${s.id}">
        <span>${s.nombre} — <strong>${s.duracion} min</strong></span>
        <div>
          <button class="btn-edit"   data-id="${s.id}" data-nombre="${s.nombre}" data-duracion="${s.duracion}">Editar</button>
          <button class="btn-delete" data-id="${s.id}">Borrar</button>
        </div>
      </div>
    `).join("");

    // EDIT
    list.querySelectorAll(".btn-edit").forEach(btn => {
      btn.addEventListener("click", () => {
        showForm("edit", {
          id:       btn.dataset.id,
          nombre:   btn.dataset.nombre,
          duracion: btn.dataset.duracion
        });
      });
    });

    // DELETE
    list.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm(`¿Borrar slot type "${btn.dataset.id}"?`)) return;
        const token = await getToken();
        const res = await fetch(`${API}/${btn.dataset.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          btn.closest(".list-item").remove();
        } else {
          alert("Error al borrar");
        }
      });
    });
  }

  // ─── botón "+ Nuevo" ────────────────────────────────────
  container.querySelector("#btn-new").addEventListener("click", () => showForm("create"));

  // ─── cancelar ───────────────────────────────────────────
  container.querySelector("#btn-cancel").addEventListener("click", hideForm);

  // ─── guardar ────────────────────────────────────────────
  container.querySelector("#btn-save").addEventListener("click", async () => {
    const nombre   = nameInput.value.trim();
    const duracion = Number(duracionInput.value); // ← number, no string

    if (!nombre)        { alert("El nombre es obligatorio");           return; }
    if (!duracion || duracion < 1) { alert("La duración debe ser mayor a 0"); return; }

    const token = await getToken();

    if (editingId) {
      const res = await fetch(`${API}/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre, duracion })
      });
      if (res.ok) { hideForm(); await fetchAll(); }
      else alert("Error al actualizar");
    } else {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre, duracion })
      });
      if (res.ok) { hideForm(); await fetchAll(); }
      else alert("Error al crear");
    }
  });

  // ─── carga inicial ───────────────────────────────────────
  await fetchAll();
}