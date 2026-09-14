function add(n1, n2, callback) {
  console.log(n1 + n2);
  callback();
}

add(10, 20, function () {
  console.log("This is a callback function");
});

