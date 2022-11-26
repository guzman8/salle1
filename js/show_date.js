// When the window is loaded, show an alert window with the local time
window.addEventListener("load", () => {
    window.alert(new Date().toLocaleTimeString());
});
