const { readFile, writeFile, mkdir, rename, rm } = require("node:fs/promises");
const { dirname } = require("node:path");
const { randomUUID } = require("node:crypto");

function createStore(filePath) {
  let queue = Promise.resolve();

  async function readFileRecords() {
    try {
      const records = JSON.parse(await readFile(filePath, "utf8"));
      if (!Array.isArray(records)) throw new Error("Stored data must be an array");
      return records;
    } catch (error) {
      if (error.code === "ENOENT") return [];
      throw error;
    }
  }

  return {
    async read() {
      await queue;
      return readFileRecords();
    },
    update(change) {
      const operation = queue.then(async () => {
        const records = await readFileRecords();
        const result = change(records);
        await mkdir(dirname(filePath), { recursive: true });
        const temporaryFile = filePath + "." + randomUUID() + ".tmp";
        try {
          await writeFile(temporaryFile, JSON.stringify(records, null, 2) + "\n", { mode: 0o600 });
          await rename(temporaryFile, filePath);
        } finally {
          await rm(temporaryFile, { force: true });
        }
        return result;
      });
      // Keep each read/change/write together so overlapping requests do not lose data.
      queue = operation.catch(() => {});
      return operation;
    }
  };
}

module.exports = { createStore };
