const fs = require("fs/promises");
const path = require("path");

const filename = path.join(__dirname, "student-promise.txt");

async function createFile() {
  await fs.writeFile(filename, "Name: Kavya Jain\nRoll No: 2503201000623");
  console.log("File created successfully");
}

async function readFile() {
  const data = await fs.readFile(filename, "utf8");
  console.log(data);
}

async function updateFile() {
  await fs.appendFile(filename, "\nGrade: A");
  console.log("File updated successfully");
}

async function deleteFile() {
  await fs.unlink(filename);
  console.log("File deleted successfully");
}

async function main() {
  try {
    await createFile();
    await readFile();
    await updateFile();
    await readFile();
    await deleteFile();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

main();

