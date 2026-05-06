import { onSession } from "./config/auth.js";
import { renderLogin, initLogin } from "./modules/login.js";


const root = document.getElementById("app");

// 🔥 render inicial inmediato (importante)
root.innerHTML = renderLogin();
initLogin(render);

function render(user) {
  root.innerHTML = "";

  if (user) {
    root.innerHTML = renderApp(user);
    initApp(user, render);
  } else {
    root.innerHTML = renderLogin();
    initLogin(render);
  }
}

// Firebase state
onSession((user) => {
  render(user);
});