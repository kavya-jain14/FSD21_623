const users = [
  {
    id: 1,
    username: "Kavya Jain",
    password: "fsd@2026"
  }
];

function findUser(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = users.find((item) => item.id === id);

      if (!user) {
        reject(new Error("User not found"));
        return;
      }

      resolve(user);
    }, 500);
  });
}

function verifyUser(user) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!user.username || !user.password) {
        reject(new Error("Username or password is missing"));
        return;
      }

      resolve({
        username: user.username,
        password: user.password,
        message: "User verified successfully"
      });
    }, 500);
  });
}

module.exports = { findUser, verifyUser };

