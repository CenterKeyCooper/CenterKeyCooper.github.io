let selectedButton = null;
let selectedOperation = '+';
let targetNumber;
let puzzlesSolved = parseInt(localStorage.getItem('puzzlesSolved')) || 0;


function selectButton(button) {
  if (selectedButton === button) {
    // Deselect the button
    button.classList.remove('selected');
    selectedButton = null;
  } else {
    if (selectedButton) {
      // Perform the selected operation
      let valueToAdd = parseInt(selectedButton.textContent);
      let currentValue = parseInt(button.textContent);
      button.textContent = operate(valueToAdd, currentValue);
      // Remove the previously selected button
      selectedButton.style.visibility = 'hidden';
      checkForWin(button.textContent);
    }
    // Select the current button
    button.classList.add('selected');
    selectedButton = button;
  }
}

function selectOperation(operation) {
  selectedOperation = operation;
  // Update selected class for operations buttons
  let operationButtons = document.querySelectorAll('.operations .operation');
  operationButtons.forEach(function(button) {
    if (button.textContent === operation) {
      button.classList.add('selected');
    } else {
      button.classList.remove('selected');
    }
  });
}

function operate(value1, value2) {
  switch(selectedOperation) {
    case '+':
      return value1 + value2;
    case '-':
      return value1 - value2;
    case '*':
      return value1 * value2;
    case '/':
      if (value2 !== 0) {
        return value1 / value2;
      } else {
        return 'Error';
      }
    default:
      return 'Error';
  }
}

function checkForWin(value) {
  if (parseInt(value) === targetNumber) {
    document.body.classList.add('green-screen');
    puzzlesSolved++;
    localStorage.setItem('puzzlesSolved', puzzlesSolved);
    document.getElementById('counter').textContent = puzzlesSolved;
    // Refresh the page
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
}

// Update the target number display


let numbers = [];
for (let i = 0; i < 6; i++) {
  numbers.push(Math.floor(Math.random() * 10) + 1);
}

let tempResult = numbers[0];
for (let i = 1; i < numbers.length; i++) {
  let randomOperation = ['+', '-', '*', '/'][Math.floor(Math.random() * 4)];
  console.log(tempResult, randomOperation);
  switch (randomOperation) {
    case '+':
      tempResult += numbers[i];
      break;
    case '-':
      tempResult -= numbers[i];
      break;
    case '*':
      tempResult *= numbers[i];
      break;
    case '/':
      if (numbers[i] != 0 && tempResult % numbers[i] === 0) {
        tempResult /= numbers[i];
      }
      else{
        tempResult += numbers[i];
      }
      break;
  }
}

targetNumber = tempResult;

document.getElementById('targetNumber').textContent = targetNumber;
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('counter').textContent = puzzlesSolved;
});
console.log("puzzles ", puzzlesSolved);

numbers = numbers.slice().sort(() => Math.random() - 0.5);

// Assign the random numbers to the buttons
let buttons = document.querySelectorAll('.button.number');
buttons.forEach(function(button, index) {
  button.textContent = numbers[index];
});