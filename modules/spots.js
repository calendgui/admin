import { getToken } from "../config/auth.js";
import { BASE_URL } from "../config/config.js";

const API = `${BASE_URL}/spots`;

export function render() {
  return `
    <div class="module-view">
      <div class="module-header">
        <h2>Spots</h2>
        <button id="btn-new">+ Nuevo</button>
      </div>

      <!-- FORM -->
      <div id="form-panel" style="display:none;">
        <h3 id="form-title">Crear Spot</h3>
        <input id="field-nombre" placeholder="Nombre" />
        <div style="display:flex;align-items:center;gap:8px;">
          <label for="field-color">Color</label>
          <input id="field-color" type="color" value="#FF5733" />
        </div>
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
  const list       = container.querySelector("#list");
  const formPanel  = container.querySelector("#form-panel");
  const formTitle  = container.querySelector("#form-title");
  const nameInput  = container.querySelector("#field-nombre");
  const colorInput = container.querySelector("#field-color");

  let editingId = null;

  // ─── helpers ────────────────────────────────────────────
  function showForm(mode = "create", data = {}) {
    editingId             = mode === "edit" ? data.id : null;
    formTitle.textContent = mode === "edit" ? "Editar Spot" : "Crear Spot";
    nameInput.value       = data.nombre ?? "";
    colorInput.value      = data.color  ?? "#FF5733";
    formPanel.style.display = "block";
    nameInput.focus();
  }

  function hideForm() {
    formPanel.style.display = "none";
    editingId        = null;
    nameInput.value  = "";
    colorInput.value = "#FF5733";
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
      list.innerHTML = "<p>No hay spots.</p>";
      return;
    }

    list.innerHTML = items.map(s => `
      <div class="list-item" data-id="${s.id}">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:24px;height:24px;border-radius:50%;background:${s.color};border:1px solid #ccc;flex-shrink:0;"></div>
          <span>${s.nombre}</span>
        </div>
        <div>
          <button class="btn-edit"   data-id="${s.id}" data-nombre="${s.nombre}" data-color="${s.color}">Editar</button>
          <button class="btn-delete" data-id="${s.id}">Borrar</button>
        </div>
      </div>
    `).join("");

    // EDIT
    list.querySelectorAll(".btn-edit").forEach(btn => {
      btn.addEventListener("click", () => {
        showForm("edit", {
          id:     btn.dataset.id,
          nombre: btn.dataset.nombre,
          color:  btn.dataset.color
        });
      });
    });

    // DELETE
    list.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm(`¿Borrar spot "${btn.dataset.id}"?`)) return;
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
    const nombre = nameInput.value.trim();
    const color  = colorInput.value;

    if (!nombre) { alert("El nombre es obligatorio"); return; }

    const token = await getToken();

    if (editingId) {
      const res = await fetch(`${API}/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre, color })
      });
      if (res.ok) { hideForm(); await fetchAll(); }
      else alert("Error al actualizar");
    } else {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre, color })
      });
      if (res.ok) { hideForm(); await fetchAll(); }
      else alert("Error al crear");
    }
  });

  // ─── carga inicial ───────────────────────────────────────
  await fetchAll();
}