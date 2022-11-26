// A NodeList that contains all anchors (links) of the navigation bar
const navBarLinks = document.getElementById("navigation_bar").querySelectorAll(".nav-link");

for (let [index, link] of navBarLinks.entries()) {
    // Adding as many listeners as items the navigation bar has, to react on 'keyup' event from keyboard.
    // The next lambda creates a Closure scope where 'link' and 'index' will have fixed values,
    // so every listener is configured for a unique combination of link and key(=index).
    document.addEventListener('keyup', (event) => {
        // The link is clicked when the code of the pressed key matches the proper link (i.e. its index)
        if (Number(event.key) === index + 1) {
            link.click();
        }
    });
};
