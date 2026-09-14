function addNumbers(num1, num2) {
  console.log(arguments);
  return num1 + num2;
}

console.log(addNumbers(5, 10, 15, 20, 25));

