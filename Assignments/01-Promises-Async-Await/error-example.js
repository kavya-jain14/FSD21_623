const { findUser, verifyUser } = require("./user-service");

async function displayMissingUser() {
  try {
    const user = await findUser(99);
    const result = await verifyUser(user);
    console.log(result);
  } catch (error) {
    console.error(`Rejected: ${error.message}`);
  }
}

displayMissingUser();

