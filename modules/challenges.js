import { getToken } from "../config/auth.js";
import { BASE_URL } from "../config/config.js";

const API = `${BASE_URL}/challenges`;

export function render() {
  return `
    <div class="module-view">
      <div class="module-header">
        <h2>Challenges</h2>
        <button id="btn-new">+ Nuevo</button>
      </div>

      <!-- FORM (oculto por defecto, debajo del botón) -->
      <div id="form-panel" style="display:none;">
        <h3 id="form-title">Crear Challenge</h3>
        <input id="field-id"     placeholder="ID"     />
        <input id="field-etapa"  placeholder="Etapa"  />
        <input id="field-nombre" placeholder="Nombre" />
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
  const list      = container.querySelector("#list");
  const formPanel = container.querySelector("#form-panel");
  const formTitle = container.querySelector("#form-title");
  const idInput    = container.querySelector("#field-id");
  const etapaInput = container.querySelector("#field-etapa");
  const nameInput  = container.querySelector("#field-nombre");

  let editingId = null;

  // ─── helpers ────────────────────────────────────────────
  function showForm(mode = "create", data = {}) {
    editingId             = mode === "edit" ? data.id : null;
    formTitle.textContent = mode === "edit" ? "Editar Challenge" : "Crear Challenge";
    idInput.value         = data.id     ?? "";
    etapaInput.value      = data.etapa  ?? "";
    nameInput.value       = data.nombre ?? "";
    idInput.disabled      = mode === "edit";
    formPanel.style.display = "block";
  }

  function hideForm() {
    formPanel.style.display = "none";
    editingId        = null;
    idInput.value    = "";
    etapaInput.value = "";
    nameInput.value  = "";
    idInput.disabled = false;
  }

  async function fetchAll() {
    list.innerHTML = "Cargando...";
    const token = await getToken();
    const res   = await fetch(API, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    // Ordenar de menor a mayor por id
    data.sort((a, b) => Number(a.id) - Number(b.id));

    renderList(data);
  }

  function renderList(items) {
    if (!items.length) {
      list.innerHTML = "<p>No hay challenges.</p>";
      return;
    }

    list.innerHTML = items.map(c => `
      <div class="list-item" data-id="${c.id}">
        <span><strong>${c.id}</strong> — ${c.etapa} — ${c.nombre}</span>
        <div>
          <button class="btn-edit"   data-id="${c.id}" data-etapa="${c.etapa}" data-nombre="${c.nombre}">Editar</button>
          <button class="btn-delete" data-id="${c.id}">Borrar</button>
        </div>
      </div>
    `).join("");

    // EDIT
    list.querySelectorAll(".btn-edit").forEach(btn => {
      btn.addEventListener("click", () => {
        showForm("edit", {
          id:     btn.dataset.id,
          etapa:  btn.dataset.etapa,
          nombre: btn.dataset.nombre
        });
      });
    });

    // DELETE
    list.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm(`¿Borrar challenge "${btn.dataset.id}"?`)) return;
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
  container.querySelector("#btn-new").addEventListener("click", () => {
    showForm("create");
  });

  // ─── cancelar ───────────────────────────────────────────
  container.querySelector("#btn-cancel").addEventListener("click", hideForm);

  // ─── guardar ────────────────────────────────────────────
  container.querySelector("#btn-save").addEventListener("click", async () => {
    const token  = await getToken();
    const etapa  = etapaInput.value.trim();
    const nombre = nameInput.value.trim();

    if (!etapa || !nombre) { alert("Etapa y nombre son obligatorios"); return; }

    if (editingId) {
      // PATCH — id va en la URL, body solo etapa y nombre
      const res = await fetch(`${API}/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ etapa, nombre })
      });
      if (res.ok) { hideForm(); await fetchAll(); }
      else alert("Error al actualizar");
    } else {
      // POST — id va en el body junto con etapa y nombre
      const id = idInput.value.trim();
      if (!id) { alert("El ID es obligatorio"); return; }
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, etapa, nombre })
      });
      if (res.ok) { hideForm(); await fetchAll(); }
      else alert("Error al crear");
    }
  });

  // ─── carga inicial ───────────────────────────────────────
  await fetchAll();
}