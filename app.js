import { onSession } from "./config/auth.js";
import { renderLogin, initLogin } from "./modules/login.js";
import { mountDashboard } from "./layout/dashboard.js";

const root = document.getElementById("app");

function render(user) {
  root.innerHTML = "";

  if (user) {
    root.appendChild(mountDashboard(user, render));
  } else {
    root.innerHTML = renderLogin();
    initLogin(render);
  }
}

onSession(render);