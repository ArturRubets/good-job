const income = document.getElementById('income');
const incomeOutput = document.getElementById('income-output');
const password = document.getElementById('pwd');
const confirmPassword = document.getElementById('cpwd');

function changeIncome() {
  incomeOutput.innerHTML = income.value;
}
income.oninput = changeIncome;
changeIncome();

function validatePassword() {
  if (password.value != confirmPassword.value) {
    confirmPassword.setCustomValidity("Passwords don't match");
  } else {
    confirmPassword.setCustomValidity('');
  }
  confirmPassword.reportValidity();
}
confirmPassword.oninput = validatePassword;
