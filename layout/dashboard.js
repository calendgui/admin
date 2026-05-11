import { logout } from "../config/auth.js";

// importa tus módulos
import * as users from "../modules/users.js";
import * as challenges from "../modules/challenges.js";
import * as announcements from "../modules/announcements.js";
import * as spots from "../modules/spots.js";
import * as ch_allowed from "../modules/ch_allowed.js";
import * as slots_type from "../modules/slots_type.js";
import * as oiko from "../modules/oiko.js";

const modules = {
  users,
  challenges,
  announcements,
  spots,
  ch_allowed,
  slots_type,
  oiko
};

export function mountDashboard(user, rerender) {
  const root = document.createElement("div");

  root.innerHTML = `
    <div class="layout">

      <!-- HEADER -->
      <header class="header">
        <div class="left">
          <h3>Admin Panel</h3>
        </div>

        <div class="right">
          <span>${user.email}</span>
          <button id="logout-btn">Logout</button>
        </div>
      </header>

      <!-- BODY -->
      <div class="body">

        <!-- SIDEBAR -->
        <aside class="sidebar">
          <button data-module="users">Users</button>
          <button data-module="challenges">Challenges</button>
          <button data-module="announcements">Announcements</button>
          <button data-module="spots">Spots</button>
          <button data-module="ch_allowed">SH Allowed</button>
          <button data-module="slots_type">Slots Type</button>
          <button data-module="oiko">Health Check</button>
        </aside>

        <!-- CONTENT -->
        <main id="content" class="content">
          <h2>Bienvenido 👋</h2>
          <p>Selecciona un módulo del menú</p>
        </main>

      </div>
    </div>
  `;

  const content = root.querySelector("#content");

  // 🔥 NAVIGATION DINÁMICA
  root.querySelectorAll("[data-module]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const name = btn.dataset.module;
      await loadModule(name, content);
    });
  });

  // 🔐 LOGOUT
  root.querySelector("#logout-btn").addEventListener("click", async () => {
    await logout();
    rerender();
  });

  return root;
}

// 🧠 loader de módulos
async function loadModule(name, container) {
  const mod = modules[name];

  if (!mod) {
    container.innerHTML = `<p>Módulo no encontrado</p>`;
    return;
  }

  container.innerHTML = mod.render();

  if (mod.init) {
    mod.init(container);
  }
}