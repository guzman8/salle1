/** This module uses REST API's */

export { getCurrentWeatherData, get5Day3HourForecastWeatherData }

const TIMESTAMPS_PER_DAY = 8;

// Weather data triggering configuration
const FIVE_MINUTES = 300000; // milliseconds
let _tickerIntervalId;
window.addEventListener("load", () => {
    loadWeatherTickerData(); // Initial data load
    _tickerIntervalId = setInterval(loadWeatherTickerData, FIVE_MINUTES);
});

// Adding event listener to the ticker's close button
const btn = document.getElementById("close-button");
btn.addEventListener("click", () => {
    const tickerWrapDiv = document.getElementById("weather-ticker-wrap");

    if (tickerWrapDiv.style.display !== "none") {
        tickerWrapDiv.style.display = "none";

        // Weather data loading is no longer necessary
        clearInterval(_tickerIntervalId);

        // Optional: data elements could be removed here

        console.log("Weather data retrieval stopped! Reload the web page.");
    }
});


// Main function
async function loadWeatherTickerData() {
    const DAYS_FORECAST = 3; // 8 timestamps per day => days*8 = #timestamps
    const weatherParentElement = document.getElementsByClassName("ticker")[0];
    let coords = await getLocation(); // [0] -> latitude, [1] -> longitude

    // Current Weather
    try {
        let data = await getCurrentWeatherData(coords[0], coords[1]);
        renderCurrentWeatherData(weatherParentElement, data);
    }
    catch (exception) {
        console.log(exception);
        renderErrorMessage(weatherParentElement, "Current weather");
    }

    // Forecast Weather
    try {
        let data = await get5Day3HourForecastWeatherData(coords[0], coords[1], DAYS_FORECAST);
        renderForecastWeatherData(weatherParentElement, data);
    }
    catch (exception) {
        console.log(exception);
        renderErrorMessage(weatherParentElement, "Forecast weather");
    }

    // Once all divs with data are rendered, the ticker animation time must be adjusted for a comfortable visualization
    updateAnimationTime(weatherParentElement);

    showWeatherTicker();
}

// Gets geolocation from the browser
function getLocation() {
    // Default location: Barcelona
    const DEFAULT_LATITUDE = 41.3888;
    const DEFAULT_LONGITUDE = 2.159;

    return new Promise((resolve) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                // Success
                (position) => {
                    console.log(`Localized position: ${position.coords.latitude} lat, ${position.coords.longitude} lon`);
                    resolve([position.coords.latitude, position.coords.longitude]);
                },
                // Error
                () => {
                    console.log(`Default position: ${DEFAULT_LATITUDE} lat, ${DEFAULT_LONGITUDE} lon`);
                    resolve([DEFAULT_LATITUDE, DEFAULT_LONGITUDE])
                });
        }
        else {
            console.log(`Default position: ${DEFAULT_LATITUDE} lat, ${DEFAULT_LONGITUDE} lon`);
            resolve([DEFAULT_LATITUDE, DEFAULT_LONGITUDE])
        }
    });
}

// Implements Builder pattern
class BasicWeatherData {
    constructor(builder) {
        this.city = builder.city;
        this.dateTime = builder.dateTime;
        this.weatherIconId = builder.weatherIconId;
        this.weatherDescription = builder.weatherDescription;
    }

    static get Builder() {
        class Builder {
            withCity(city) {
                this.city = city;
                return this;
            }

            withDateTime(dateTime) {
                this.dateTime = dateTime;
                return this;
            }

            withWeatherIconId(weatherIconId) {
                this.weatherIconId = weatherIconId;
                return this;
            }

            withWeatherDescription(weatherDescription) {
                this.weatherDescription = weatherDescription;
                return this;
            }

            build() {
                return new BasicWeatherData(this);
            }
        }

        return Builder;
    }
}

// Implements Builder pattern
class TimestampData {
    constructor(builder) {
        this.basicData = builder.basicData;
        this.keyValueData = builder.keyValueData;
    }

    static get Builder() {
        class Builder {
            constructor(basicData) {
                this.basicData = basicData;
                this.keyValueData = []; // It must be defined upfront as array
                return this;
            }

            withData(name, value) {
                this.keyValueData.push({ "name": name, "value": value });
                return this;
            }

            build() {
                return new TimestampData(this);
            }
        }

        return Builder;
    }
}

class CurrentWeather {
    // Private attributes
    #basicData;
    #keyValueData = [];

    constructor(data) {
        this.#basicData = new BasicWeatherData.Builder()
            .withCity(data.name)
            .withWeatherIconId(data.weather[0].icon)
            .withWeatherDescription(data.weather[0].description)
            .build();

        this.push("cloudiness", data.clouds.all + "%");
        this.push("temp", data.main.temp + "&deg;C");
        this.push("humidity", data.main.humidity + "%");
        this.push("feels-like temp", data.main.feels_like + "&deg;C");
        this.push("min temp", data.main.temp_min + "&deg;C");
        this.push("max temp", data.main.temp_max + "&deg;C");
        this.push("pressure", data.main.pressure + "hpa");
        this.push("wind speed", data.wind.speed + "m/s");
        // In here, mapping degrees to cardinal direction
        this.push("wind direction", this.getCardinalDirection(data.wind.deg));
    }

    push(name, value) {
        this.#keyValueData.push({ "name": name, "value": value });
    }

    // Not necessary to make this object iterable. Just for illustrative purposes.
    *[Symbol.iterator]() {
        yield this.#basicData;

        for (const datum of this.#keyValueData) {
            yield datum;
        }
    }

    getCardinalDirection(angle) {
        // The arrow direction follows the meteorological convention (instead of the oceanographic)
        const directions = ['↑ N', '↗ NE', '→ E', '↘ SE', '↓ S', '↙ SW', '← W', '↖ NW']; // 8 directions
        const degreesPerDirection = 360 / directions.length;

        return directions[Math.round(angle / degreesPerDirection) % directions.length];
    }
}

class ForecastWeather {
    #city;
    #timestampData = [];

    constructor(data) {
        this.#city = data.city.name;

        for (let timeStamp of data.list) {
            const basicData = new BasicWeatherData.Builder()
                .withDateTime(this.toTimeZoneDateTime(timeStamp.dt))
                .withWeatherIconId(timeStamp.weather[0].icon)
                .withWeatherDescription(timeStamp.weather[0].description)
                .build();

            const timestampData = new TimestampData.Builder(basicData)
                .withData("temp", timeStamp.main.temp + "&deg;C")
                .withData("humidity", timeStamp.main.humidity + "%")
                .build();

            this.#timestampData.push(timestampData);
        }
    }

    // From UTC timestamp (in seconds) to short format (local date time)
    toTimeZoneDateTime(timestampInSeconds) {
        // Configuring short format in time and dates
        const shortTime = new Intl.DateTimeFormat("es", {
            timeStyle: "short",
            dateStyle: "short"
        });
        // Seconds from current time zone to UTC
        const timezoneOffsetInSeconds = -new Date().getTimezoneOffset() * 60;
        //console.log(`Time zone offset (h): ${timezoneOffsetInSeconds / 3600}`);

        const timeZoneDateTime = shortTime.format(new Date((timestampInSeconds + timezoneOffsetInSeconds) * 1000));
        //console.log(`Current time: ${timeZoneDateTime}`)

        return timeZoneDateTime;
    }

    get city() {
        return this.#city;
    }

    get timestampData() {
        return this.#timestampData;
    }
}

// Current weather API call
async function getCurrentWeatherData(lat, lon) {
    const units = "metric";
    const apiKey = "d64272ca54d8ef10570906c001f7cb3c";
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`;

    console.log(url);

    let response = await fetch(url);
    let data = await response.json();

    //console.dir(data);

    // Final container of data
    const currentWeather = new CurrentWeather(data);
    console.dir(currentWeather);

    return currentWeather;
}

// Forecast weather, 5-day/3-hour, API call
async function get5Day3HourForecastWeatherData(lat, lon, numDays) {
    const numTimestamps = numDays * TIMESTAMPS_PER_DAY;
    const units = "metric";
    const apiKey = "d64272ca54d8ef10570906c001f7cb3c";
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&cnt=${numTimestamps}&appid=${apiKey}`;

    console.log(url);

    let response = await fetch(url);
    let data = await response.json();

    //console.dir(data);

    // Final container of data
    const forecastWeather = new ForecastWeather(data);
    console.dir(forecastWeather);

    return forecastWeather;
}

function renderCurrentWeatherData(parentElement, currentWeatherData) {
    let currentWeatherNode = cleanOrCreateSpanNode(parentElement, "current-weather");

    // Addition of data
    for (let datum of currentWeatherData) {
        if (datum instanceof BasicWeatherData) {
            // First div: 'Current Weather' title, city, icon and weather description
            // 1. Title and city
            let div = document.createElement("div");
            div.classList.add("ticker__item", "italic", "strong");
            div.innerHTML = `Current weather in <span class="weather-city">${datum.city}</span>: `;
            currentWeatherNode.append(div);

            // 2. Weather icon
            div = document.createElement("div");
            div.classList.add("ticker__item");
            // Creating an image like this because a dynamic style must be added (background image below)
            let img = document.createElement("img");
            img.height = "30";
            img.width = "50";
            img.alt = "weather icon";
            img.src = "http://openweathermap.org/images/transparent.png";
            img.style.background = `url('http://openweathermap.org/img/w/${datum.weatherIconId}.png') no-repeat scroll right transparent`;
            div.appendChild(img);

            // 3. Weather description
            div.innerHTML += ` <span class="weather-value">${datum.weatherDescription}</span>`;

            currentWeatherNode.append(div);
        }
        else {
            // Rest of divs: key/value data
            let div = document.createElement("div");
            div.classList.add("ticker__item");
            div.innerHTML = `${datum.name}: <span class="weather-value">${datum.value}</span>`;

            currentWeatherNode.append(div);
        }
    }
}

function renderForecastWeatherData(parentElement, forecastWeatherData) {
    const numDays = forecastWeatherData.timestampData.length / TIMESTAMPS_PER_DAY;

    let forecastWeatherNode = cleanOrCreateSpanNode(parentElement, "forecast-weather");

    // Addition of data
    // First div: 'Forecast Weather' title and city name
    let div = document.createElement("div");
    div.classList.add("ticker__item", "italic", "strong");
    div.innerHTML = `Forecast weather for next ${numDays} days in <span class="weather-city">${forecastWeatherData.city}</span>:`;
    forecastWeatherNode.append(div);

    // Rest of divs: timestamps are comprised by date/time, weather icon, weather description and 'n' key/value data
    for (let ts of forecastWeatherData.timestampData) {
        let div = document.createElement("div");
        div.classList.add("ticker__item");

        // 1. Date/Hour
        div.innerHTML += ` <span class="weather-timestamp">${ts.basicData.dateTime}</span>`;

        // 2. Weather icon. Creating an image like this because a dynamic style must be added
        let img = document.createElement("img");
        img.height = "30";
        img.width = "50";
        img.alt = "weather icon";
        img.src = "http://openweathermap.org/images/transparent.png";
        img.style.background = `url('http://openweathermap.org/img/w/${ts.basicData.weatherIconId}.png') no-repeat scroll center transparent`;
        div.appendChild(img);

        // 3. Weather description
        div.innerHTML += ` <span class="weather-value">${ts.basicData.weatherDescription}</span>`;

        // 4. Other data: key/value pairs
        for (let datum of ts.keyValueData) {
            div.innerHTML += ` ${datum.name}: <span class="weather-value">${datum.value}</span>`;
        }

        forecastWeatherNode.append(div);
    }
}

// Remove its children if exists, or creates a new span tag
function cleanOrCreateSpanNode(parentElement, spanId) {
    let spanNode = parentElement.querySelector(`#${spanId}`);

    if (spanNode !== null) {
        spanNode.textContent = "";
    }
    else { // Or create the parent node for the forecast weather data
        let span = document.createElement("span");
        span.id = spanId;
        spanNode = parentElement.appendChild(span);
    }

    return spanNode;
}

function renderErrorMessage(parentElement, serviceName) {
    console.log(`${serviceName} data not available`);

    let div = document.createElement("div");
    div.classList.add("ticker__item", "italic", "strong");
    div.innerHTML = `${serviceName} data not available`;

    parentElement.append(div);
}

// Updates the ticker animation time according to the number of elements displayed
function updateAnimationTime(parentElement) {
    let numTickerElements = parentElement.querySelectorAll(".ticker__item").length;
    console.log(`Ticker elements rendered: ${numTickerElements}`);

    const calculatedAnimationDuration = (5 * numTickerElements) + "s";
    parentElement.style.animationDuration = calculatedAnimationDuration; // seconds
    parentElement.style.webkitAnimationDuration = calculatedAnimationDuration; // seconds

    console.log(`Ticker animation time: ${calculatedAnimationDuration}`);
    //console.log(parentElement.style);
}

function showWeatherTicker() {
    let weatherTicker = document.getElementsByClassName("ticker")[0];
    weatherTicker.style.display = "inline-block";
}
