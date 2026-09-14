const fs = require("fs");
const path = require("path");

const filename = path.join(__dirname, "student-callback.txt");

function createFile(next) {
  fs.writeFile(filename, "Name: Kavya Jain\nRoll No: 2503201000623", (error) => {
    if (error) {
      next(error);
      return;
    }

    console.log("File created successfully");
    next();
  });
}

function readFile(next) {
  fs.readFile(filename, "utf8", (error, data) => {
    if (error) {
      next(error);
      return;
    }

    console.log(data);
    next();
  });
}

function updateFile(next) {
  fs.appendFile(filename, "\nGrade: A", (error) => {
    if (error) {
      next(error);
      return;
    }

    console.log("File updated successfully");
    next();
  });
}

function deleteFile(next) {
  fs.unlink(filename, (error) => {
    if (error) {
      next(error);
      return;
    }

    console.log("File deleted successfully");
    next();
  });
}

createFile((createError) => {
  if (createError) {
    console.error(createError.message);
    return;
  }

  readFile((readError) => {
    if (readError) {
      console.error(readError.message);
      return;
    }

    updateFile((updateError) => {
      if (updateError) {
        console.error(updateError.message);
        return;
      }

      readFile((secondReadError) => {
        if (secondReadError) {
          console.error(secondReadError.message);
          return;
        }

        deleteFile((deleteError) => {
          if (deleteError) {
            console.error(deleteError.message);
          }
        });
      });
    });
  });
});

