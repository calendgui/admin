import { onSession } from "./config/auth.js";
import { renderLogin, initLogin } from "./modules/login.js";
import { renderDashboard, initDashboard } from "./modules/dashboard.js";

const root = document.getElementById("app");

function render(user) {
  root.innerHTML = "";

  if (user) {
    root.innerHTML = renderDashboard(user);
    initDashboard(user, render);
  } else {
    root.innerHTML = renderLogin();
    initLogin(render);
  }
}

onSession(render);