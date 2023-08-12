const dotenv = require("dotenv");
const mongoose = require("mongoose");
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

app.listen(3000, () => {
  console.log("Server is listening");
});
