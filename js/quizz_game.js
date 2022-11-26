/** This module uses GraphQL API's */

import * as Util from "./utils.js"

const NUM_ANSWERS = 4;
const QuestionType = { FLAG: 0, CAPITAL: 1, LANGUAGE: 2 };  // Enum

// Global variables
let _countries;
let _chosenCountryIndex;
let _currentQuestion;
let _correctAnswer; // Valid values: 0, ..., NUM_ANSWERS - 1
// Array with the references of the elements with id "answer1", ..."answer4"
let _answers = Array.from({ length: NUM_ANSWERS }, (_, i) => document.getElementById(`answer${i + 1}`));
// Assigning listeners to each answer, associating to them their position on the grid of answers
_answers.forEach((answer, idx) => answer.addEventListener('click', () => checkResult(idx, _correctAnswer)));


// Main function
getCountriesInfo()
  .then(response => {
    _countries = response.data.countries;
    nextQuestionOrNewGame();
  });

// Call to API to get the information of all countries
async function getCountriesInfo() {
  let query = `{
    countries {
      code
      name
      capital
      emoji
      languages {
        code
        name
      }
    }
  }`;
  let response = await fetch("https://countries.trevorblades.com", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query: query
    })
  });
  let data = await response.json();

  console.log(data);
  return data;
}

async function checkResult(selectedAnswer, correctAnswer) {
  if (selectedAnswer === correctAnswer) {
    _answers[selectedAnswer].style.backgroundColor = 'green';

    setTimeout(() => nextQuestionOrNewGame(), Util.ONE_SEC)
  } else {
    _answers[selectedAnswer].style.backgroundColor = 'red';
  }
}

async function nextQuestionOrNewGame() {
  if (_currentQuestion === QuestionType.LANGUAGE || !_chosenCountryIndex) {
    _currentQuestion = QuestionType.FLAG;

    // The questions will be about the next country:
    _chosenCountryIndex = Util.getRandomIntInclusive(0, _countries.length - 1);
    console.log(`Chosen country: ${_countries[_chosenCountryIndex].name} (index: ${_chosenCountryIndex})`)
  }
  else {
    // Next question
    _currentQuestion = (_currentQuestion + 1) % Object.keys(QuestionType).length; // The enum has not 'length' by itself
  }

  await nextQuestion(_chosenCountryIndex, _currentQuestion);
}

async function nextQuestion(chosenCountryIndex, currentQuestion) {
  switch (currentQuestion) {
    case QuestionType.FLAG: {
      console.log("Question about its FLAG");

      // Adding 3 random wrong answers (country indexes) into the array of possible answers
      let wrongAnswersIndexes = Util.getDistinctRandomValuesExcluding(Array.from(Array(_countries.length).keys()), NUM_ANSWERS - 1, [chosenCountryIndex]);
      let possibleAnswersIndexes = [chosenCountryIndex, ...wrongAnswersIndexes];
      console.log(`Possible answers: ${possibleAnswersIndexes}`);

      // Shuffling the answers
      possibleAnswersIndexes = Util.shuffle(possibleAnswersIndexes);
      console.log(`Shuffled answers: ${possibleAnswersIndexes}`);

      // Searching the position of the correct answer
      _correctAnswer = possibleAnswersIndexes.findIndex((value) => value === chosenCountryIndex);

      let arrayOfEmojis = possibleAnswersIndexes.map(idx => _countries[idx].emoji);
      renderFlagQuestion(_countries[chosenCountryIndex].name, arrayOfEmojis);
    }
      break;

    case QuestionType.CAPITAL: {
      console.log("Question about its CAPITAL");

      // Adding 3 random wrong answers (country indexes) into the array of possible answers.
      // PS: There are some countries without capital, so they must be excluded from the possible answers.
      // Creating and array of the indexes (relative to '_countries' array) of those countries that have capital:
      let fullListOfCountriesWithCapitalIndexes = _countries.reduce((previous, current, currentIndex) => {
        if (current.capital != null) {
          return [...previous, currentIndex];
        }
        return previous;
      }, []);
      //console.log(`Total number of countries ${_countries.length}. Number of countries with capital: ${fullListOfCountriesWithCapitalIndexes.length}`);
      let wrongAnswersIndexes = Util.getDistinctRandomValuesExcluding(fullListOfCountriesWithCapitalIndexes, NUM_ANSWERS - 1, [chosenCountryIndex]);
      let possibleAnswersIndexes = [chosenCountryIndex, ...wrongAnswersIndexes];
      console.log(`Possible answers: ${possibleAnswersIndexes}`);

      // Shuffling the answers
      possibleAnswersIndexes = Util.shuffle(possibleAnswersIndexes);
      console.log(`Shuffled answers: ${possibleAnswersIndexes}`);

      // Searching the position of the correct answer
      _correctAnswer = possibleAnswersIndexes.findIndex((value) => value === chosenCountryIndex);

      let arrayOfCapitals = possibleAnswersIndexes.map(idx => _countries[idx].capital);
      renderCapitalQuestion(_countries[chosenCountryIndex].name, arrayOfCapitals);
    }
      break;

    case QuestionType.LANGUAGE: {
      console.log("Question about its LANGUAGE");

      /* This is a special case because languages are not unique in each country, so it is not valid to select 3
       random countries like in the previous questions. The 3 random languages must be selected from a full list
       of languages and they must not coincide with any of the oficial languages. */

      // Array of all available languages, without repetitions
      let fullListOfLanguages = Array.from(new Set(_countries.flatMap(country => country.languages.flatMap(language => language.name))));
      //console.log(`Game's full list of languages: ${fullListOfLanguages}`);

      // Array of all languages of the chosen country
      let chosenCountryLanguages = _countries[chosenCountryIndex].languages.flatMap(language => language.name);
      console.log(`Official languages of the chosen country: ${chosenCountryLanguages}`);

      // Selecting only one of the official languages of the chosen country
      let chosenCountryLanguage = chosenCountryLanguages[Util.getRandomIntInclusive(0, chosenCountryLanguages.length - 1)];
      let wrongAnswers = Util.getDistinctRandomValuesExcluding(fullListOfLanguages, NUM_ANSWERS - 1, chosenCountryLanguages);
      let possibleAnswers = [chosenCountryLanguage, ...wrongAnswers];
      console.log(`Possible answers: ${possibleAnswers}`);

      // Shuffling the answers
      possibleAnswers = Util.shuffle(possibleAnswers);
      console.log(`Shuffled answers: ${possibleAnswers}`);

      // Searching the position of the correct answer
      _correctAnswer = possibleAnswers.findIndex((value) => value === chosenCountryLanguage);

      renderLanguageQuestion(_countries[chosenCountryIndex].name, possibleAnswers);
    }
      break;
  }
}

function renderFlagQuestion(chosenCountry, arrayOfEmojis) {
  let question = document.querySelector("#question");
  // Rendering the question and answers
  question.innerHTML = `What is the flag of <span class="country">${chosenCountry}</span>?`;

  _answers.forEach((answer, idx) => {
    answer.style.background = 'rgb(197, 197, 197)'; // Reset of the answers' default color
    answer.innerHTML = `<span class="flag">${arrayOfEmojis[idx]}</span>`;
  });
}

function renderCapitalQuestion(chosenCountry, arrayOfCapitals) {
  let question = document.querySelector("#question");
  // Rendering the question and answers
  question.innerHTML = `What is the capital of <span class="country">${chosenCountry}</span>?`;

  _answers.forEach((answer, idx) => {
    answer.style.background = 'rgb(197, 197, 197)'; // Reset of the answers' default color
    answer.innerText = arrayOfCapitals[idx];
    answer.ariaLabel = arrayOfCapitals[idx];
  });
}

function renderLanguageQuestion(chosenCountry, arrayOfLanguages) {
  let question = document.querySelector("#question");
  // Rendering the question and answers
  question.innerHTML = `Which of these languages is official in <span class="country">${chosenCountry}</span>?`;

  _answers.forEach((answer, idx) => {
    answer.style.background = 'rgb(197, 197, 197)'; // Reset of the answers' default color
    answer.innerText = arrayOfLanguages[idx];
    answer.ariaLabel = arrayOfLanguages[idx];
  });
}
