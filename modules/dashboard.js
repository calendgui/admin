export function renderDashboard(user) {
  return `
    <h1>Dashboard</h1>
    <p>${user.email}</p>
    <button id="logout">Logout</button>
  `;
}

export function initDashboard() {
  document.getElementById("logout").addEventListener("click", async () => {
    const { logout } = await import("../config/auth.js");
    logout();
  });
}