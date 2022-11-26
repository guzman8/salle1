// Constants of time in milliseconds
const ONE_SEC = 1000;
const TWO_SECS = 2000;

// Return a value between 'min' and 'max', included
function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1) + min);
}

/* Returns 'required' random values from an array of values, excluding the ones in 'excludedValues'.
   It guarantees to not repeating values.
   It uses getRandomIntInclusive.
*/
function getDistinctRandomValuesExcluding(arrayOfValues, required, excludedValues) {
    const randomArray = [];
    const mutableExcludedValues = Array.from(excludedValues);
    console.log("arrayOfValues.length: " + arrayOfValues.length)
    console.log("Initial excludedValues: " + mutableExcludedValues)

    for (let gathered = 0; gathered < required; gathered++) {
        let validValues = Array.from(arrayOfValues).filter((value) => !Array.from(mutableExcludedValues).includes(value));

        if (validValues.length < (required - gathered)) {
            throw new RangeError("Impossible to supply the required amount of values");
        }

        let randomValue = validValues[getRandomIntInclusive(0, validValues.length - 1)];
        // Valid random value, let's progress
        randomArray.push(randomValue);
        // The random value cannot appear again
        mutableExcludedValues.push(randomValue);
    }

    console.log("Final excludedValues: " + mutableExcludedValues)
    console.log("Random values selected: " + randomArray);
    return randomArray;
}

// Fisher-Yates (aka Knuth) Shuffle algorithm
function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }

    return array;
}

// Exporting constants
export { ONE_SEC, TWO_SECS }
// Exporting functions
export { getRandomIntInclusive, getDistinctRandomValuesExcluding, shuffle }
