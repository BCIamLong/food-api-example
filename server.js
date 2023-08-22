const dotenv = require("dotenv");
const mongoose = require("mongoose");

process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  console.log("Application shuting down");
  process.exit(1);
});

const app = require("./app");

dotenv.config({ path: "./config.env" });

(async () => {
  try {
    await mongoose.connect(process.env.DATABASE);
    console.log("DB connect success");
  } catch (err) {
    console.log(err);
  }
})();

const server = app.listen(3000, () => {
  console.log("Server is listening");
});

process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  server.close(() => {
    console.log("Application shuting down");
    process.exit(1);
  });
});
