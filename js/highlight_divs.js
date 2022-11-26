// When the window is loaded...
window.addEventListener("load", () => {
    const divs = document.getElementsByTagName('div');

    // ...add to every 'div', two listeners:
    for (let div of divs) {
        // When mouse is over...
        div.addEventListener('mouseover', (event) => {
            // ...and Alt key is pressed, a new CSS class is added to highlight the div (target)
            if (event.altKey) {
                // This CSS class must be defined in 'main-styles.css' file
                event.target.classList.add("div_highlighted");
            }
        });

        // When mouse is out...
        div.addEventListener('mouseout', (event) => {
            // ...the CSS class is removed (so it's disabled)
            event.target.classList.remove("div_highlighted");
        });
    };
});
