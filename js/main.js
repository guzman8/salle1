//import "./show_date.js";
import "./highlight_divs.js";
//import "./navigate_sections.js"; // Replaced by keynav_controller.js
import "./playful_portfolio.js"
import "./weather_ticker.js"
import "./quizz_game.js"


// Stimulus library used to navigate through sections
import { Application } from "https://unpkg.com/@hotwired/stimulus/dist/stimulus.js"
import { KeynavController } from "./keynav_controller.js"

const app = Application.start();
app.register("kn", KeynavController);
