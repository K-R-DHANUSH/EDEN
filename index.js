// MENU
const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");

navToggle.addEventListener("click", () => {
    navMenu.classList.toggle("active");
});

// THEME
const themeBtn = document.getElementById("themeToggle");

function setThemeIcon() {
    const isDark = document.body.classList.contains("dark-theme");
    themeBtn.textContent = isDark ? "🌙" : "☀️";
}

setThemeIcon();

themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
    setThemeIcon();
});
