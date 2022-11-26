import * as Util from "./utils.js"

window.addEventListener("load", () => window.setInterval(exchangePortfolioElements, Util.TWO_SECS));

// Main function
function exchangePortfolioElements() {
    // Elements to exchange in Portfolio
    let elements = document
        .getElementById("portfolio_grid")
        .querySelector(".form-group").children;

    if (elements.length < 2) {
        console.log("Exchange is not possible!");
        return;
    }

    let first = Util.getRandomIntInclusive(0, elements.length - 1);
    let second;
    do {
        second = Util.getRandomIntInclusive(0, elements.length - 1);
    } while (first === second); // Loop to avoid repeated elements, which is useless

    elements.item(second).after(elements.item(first));
    elements.item(first).after(elements.item(second));
}
