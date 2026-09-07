function initDarkModeToggle() {
    const toggleButton = document.getElementById('darkModeToggle');
    if (!toggleButton) return;

    const savedMode = localStorage.getItem('darkMode');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let currentMode = savedMode || (systemPrefersDark ? 'dark' : 'light');

    updateDarkMode(currentMode);
    toggleButton.dataset.mode = currentMode;

    toggleButton.addEventListener('click', () => {
        currentMode = currentMode === 'dark' ? 'light' : 'dark';
        updateDarkMode(currentMode);
        toggleButton.dataset.mode = currentMode;
        localStorage.setItem('darkMode', currentMode);
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
        if (localStorage.getItem('darkMode')) return;
        currentMode = event.matches ? 'dark' : 'light';
        updateDarkMode(currentMode);
        toggleButton.dataset.mode = currentMode;
    });
}

function updateDarkMode(mode) {
    document.documentElement.dataset.theme = mode;
}

document.addEventListener('DOMContentLoaded', initDarkModeToggle);
