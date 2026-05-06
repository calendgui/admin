import { getToken } from "../config/auth.js";
import { BASE_URL } from "../config/config.js";

export function render() {
  return `
    <div class="module-view">
      <div class="module-header">
        <h2>Challenges</h2>
      </div>

      <button id="btn-load">Cargar challenges</button>

      <div id="list"></div>

      <hr />

      <h3>Crear / Editar</h3>

      <input id="id" placeholder="ID" />
      <input id="nombre" placeholder="Nombre" />

      <button id="btn-create">Crear</button>
      <button id="btn-update">Actualizar</button>
    </div>
  `;
}

export function init(container) {
  const list = container.querySelector("#list");

  const idInput = container.querySelector("#id");
  const nameInput = container.querySelector("#nombre");

  // 🔥 GET ALL
  container.querySelector("#btn-load").addEventListener("click", async () => {
    const token = await getToken();

    const res = await fetch(`${BASE_URL}/challenges`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    list.innerHTML = data
      .map(
        (c) => `
        <div style="padding:5px;border:1px solid #ccc;margin:5px;">
          <strong>${c.id}</strong> - ${c.nombre}

          <button data-id="${c.id}" class="delete">X</button>
          <button data-id="${c.id}" class="edit">Edit</button>
        </div>
      `
      )
      .join("");

    // DELETE
    list.querySelectorAll(".delete").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const token = await getToken();

        await fetch(`${BASE_URL}/challenges/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        btn.parentElement.remove();
      });
    });

    // EDIT (solo carga datos al form)
    list.querySelectorAll(".edit").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;

        const token = await getToken();

        const res = await fetch(`${BASE_URL}/challenges/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await res.json();

        idInput.value = data.id;
        nameInput.value = data.nombre;
      });
    });
  });

  // 🔥 CREATE
  container.querySelector("#btn-create").addEventListener("click", async () => {
    const token = await getToken();

    await fetch(`${BASE_URL}/challenges`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        id: idInput.value,
        nombre: nameInput.value
      })
    });

    alert("Creado ✔");
  });

  // 🔥 UPDATE
  container.querySelector("#btn-update").addEventListener("click", async () => {
    const token = await getToken();

    await fetch(`${BASE_URL}/challenges/${idInput.value}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        nombre: nameInput.value
      })
    });

    alert("Actualizado ✔");
  });
}