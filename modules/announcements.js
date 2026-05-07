import { getToken } from "../config/auth.js";
import { BASE_URL } from "../config/config.js";

const API = `${BASE_URL}/announcements`;

export function render() {
  return `
    <div class="module-view">
      <div class="module-header">
        <h2>Announcements</h2>
        <button id="btn-new">+ Nuevo</button>
      </div>

      <!-- FORM -->
      <div id="form-panel" style="display:none;">
        <h3>Crear Announcement</h3>
        <input id="field-titulo"  placeholder="Título"   />
        <input id="field-img_url" placeholder="URL imagen" />
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
  const tituloInput  = container.querySelector("#field-titulo");
  const imgUrlInput  = container.querySelector("#field-img_url");

  // ─── helpers ────────────────────────────────────────────
  function showForm() {
    tituloInput.value  = "";
    imgUrlInput.value  = "";
    formPanel.style.display = "block";
    tituloInput.focus();
  }

  function hideForm() {
    formPanel.style.display = "none";
    tituloInput.value = "";
    imgUrlInput.value = "";
  }

  async function fetchAll() {
    list.innerHTML = "Cargando...";
    // GET no requiere token según la doc
    const res  = await fetch(API);
    const data = await res.json();
    renderList(data);
  }

  function renderList(items) {
    if (!items.length) {
      list.innerHTML = "<p>No hay announcements.</p>";
      return;
    }

    list.innerHTML = items.map(a => `
      <div class="list-item" data-id="${a.id}">
        <div class="list-item-info">
          ${a.img_url ? `<img src="${a.img_url}" alt="${a.titulo}" style="width:100%;max-width:300px;height:180px;object-fit:cover;border-radius:8px;display:block;margin-bottom:6px;" />` : ""}
          <span>${a.titulo}</span>
        </div>
        <button class="btn-delete" data-id="${a.id}">Borrar</button>
      </div>
    `).join("");

    // DELETE
    list.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm(`¿Borrar announcement "${btn.dataset.id}"?`)) return;
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
  container.querySelector("#btn-new").addEventListener("click", showForm);

  // ─── cancelar ───────────────────────────────────────────
  container.querySelector("#btn-cancel").addEventListener("click", hideForm);

  // ─── guardar ────────────────────────────────────────────
  container.querySelector("#btn-save").addEventListener("click", async () => {
    const titulo  = tituloInput.value.trim();
    const img_url = imgUrlInput.value.trim();

    if (!titulo) { alert("El título es obligatorio"); return; }

    const token = await getToken();
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ titulo, img_url })
    });

    if (res.ok) { hideForm(); await fetchAll(); }
    else alert("Error al crear");
  });

  // ─── carga inicial ───────────────────────────────────────
  await fetchAll();
}