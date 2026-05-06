export function render() {
  return `
    <div class="module-view">
      <div class="module-header">
        <span class="tag">módulo</span>
        <h2>TITLE_HERE</h2>
      </div>

      <p class="module-desc">
        Módulo TITLE_HERE funcionando correctamente 🚀
      </p>

      <button id="test-btn">Test action</button>
    </div>
  `;
}

export function init(container) {
  const btn = container.querySelector("#test-btn");

  btn.addEventListener("click", () => {
    alert("Módulo funcionando ✔");
  });
}