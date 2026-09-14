const { findUser, verifyUser } = require("./user-service");

async function displayUser() {
  try {
    console.log("Checking user with async/await...");
    const user = await findUser(1);
    const result = await verifyUser(user);

    console.log(`Username: ${result.username}`);
    console.log(`Password: ${result.password}`);
    console.log(result.message);
  } catch (error) {
    console.error(error.message);
  } finally {
    console.log("Async/await workflow completed");
  }
}

displayUser();

