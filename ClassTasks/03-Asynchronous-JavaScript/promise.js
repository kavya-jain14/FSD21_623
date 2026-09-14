const userData = {
  username: "Kavya Jain",
  password: "workshop-password"
};

function getUserData() {
  return new Promise((resolve, reject) => {
    if (userData.username && userData.password) {
      resolve(`Username: ${userData.username}, Password: ${userData.password}`);
      return;
    }

    reject(new Error("User data is missing"));
  });
}

getUserData()
  .then((data) => console.log(data))
  .catch((error) => console.error(error.message));

