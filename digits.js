document.addEventListener('DOMContentLoaded', () => {
    const digitsContainer = document.getElementById('digits-container');
  
    // Initial numbers on the screen
    const numbers = [1, 2, 3, 4, 5, 6];
    const operations = ['+', '-', '*', '/'];
  
    // Create number buttons
    numbers.forEach(number => {
      const button = createButton(number);
      digitsContainer.appendChild(button);
    });
  
    // Create operation buttons
    operations.forEach(operation => {
      const button = createButton(operation, true);
      digitsContainer.appendChild(button);
    });
  
    let selectedButtons = [];
  
    // Add click event listener to each button
    digitsContainer.addEventListener('click', (event) => {
      const clickedButton = event.target;
  
      if (clickedButton.tagName === 'BUTTON') {
        if (selectedButtons.length < 2) {
          // Highlight selected button
          clickedButton.classList.add('selected');
          selectedButtons.push(clickedButton);
  
          if (selectedButtons.length === 2) {
            performOperation();
          }
        } else {
          // Remove highlighting from previously selected buttons
          selectedButtons.forEach(button => button.classList.remove('selected'));
  
          // Clear the selected buttons array
          selectedButtons = [];
        }
      }
    });
  
    // Function to create a button
    function createButton(value, isOperation = false) {
      const button = document.createElement('button');
      button.textContent = value;
      button.addEventListener('click', () => handleClick(value, isOperation));
      return button;
    }
  
    // Function to handle button click
    function handleClick(value, isOperation) {
      if (selectedButtons.length === 1 && isOperation) {
        // If an operation is clicked after selecting a number, update the operation
        selectedButtons[0].textContent = value;
        selectedButtons[0].classList.remove('selected');
        selectedButtons = [];
      } else if (selectedButtons.length === 0 && !isOperation) {
        // If a number is clicked, highlight it
        selectedButtons.push(event.target);
        selectedButtons[0].classList.add('selected');
      }
    }
  
    // Function to perform the selected operation
    function performOperation() {
      const num1 = parseFloat(selectedButtons[0].textContent);
      const num2 = parseFloat(selectedButtons[1].textContent);
      const operation = selectedButtons[2].textContent;
  
      let result;
  
      switch (operation) {
        case '+':
          result = num1 + num2;
          break;
        case '-':
          result = num1 - num2;
          break;
        case '*':
          result = num1 * num2;
          break;
        case '/':
          result = num1 / num2;
          break;
        default:
          result = 0;
      }
  
      // Update the second number with the result
      selectedButtons[1].textContent = result;
      selectedButtons[0].classList.remove('selected');
  
      // Clear the selected buttons array
      selectedButtons = [];
    }
  });
  