import { Controller } from "https://unpkg.com/@hotwired/stimulus/dist/stimulus.js"

class KeynavController extends Controller {
    static targets = ["link"];

    connect() {
        console.log("KeynavController working!", this.element)
    }

    follow(event) {
        // Cases when not to attend the event: If numbers are typed on text or textarea fields
        const nodeName = event.target.nodeName.toLowerCase();
        if (nodeName === "input" || nodeName === "textarea") {
            console.log("Digit typed from an INPUT field or TEXTAREA! Navigation prevented!");
            return;
        }

        // Event codes to accept are: Digit1, ..., Digit9, Numpad1, ..., Numpad9
        console.log(`Typed the key ${event.code}. Navigating...`);

        let number = Number(event.code.slice(-1)) - 1;
        // Avoiding the coupling with HTML/CSS via 'targets' variable
        let link = this.linkTargets[number];
        link && link.click(); // if link is defined, then click
    }
}

export { KeynavController }
