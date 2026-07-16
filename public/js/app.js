document.addEventListener("DOMContentLoaded", () => {
  const burger = document.getElementById("burgerBtn");
  const sidebar = document.getElementById("appSidebar");

  if (burger && sidebar) {
    burger.addEventListener("click", () => sidebar.classList.toggle("open"));

    document.addEventListener("click", (e) => {
      if (
        window.innerWidth <= 991 &&
        sidebar.classList.contains("open") &&
        !sidebar.contains(e.target) &&
        !burger.contains(e.target)
      ) {
        sidebar.classList.remove("open");
      }
    });
  }
});
