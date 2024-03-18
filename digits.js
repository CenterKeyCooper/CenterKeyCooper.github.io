let selectedButton = null;
let selectedOperation = '+';
let targetNumber = Math.floor(Math.random() * 600) + 1;

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
  }
}

// Update the target number display
document.getElementById('targetNumber').textContent = targetNumber;

let numbers = [];
for (let i = 0; i < 6; i++) {
  numbers.push(Math.floor(Math.random() * 10) + 1);
}

// Assign the random numbers to the buttons
let buttons = document.querySelectorAll('.button.number');
buttons.forEach(function(button, index) {
  button.textContent = numbers[index];
});