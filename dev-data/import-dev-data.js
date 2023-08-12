const fs = require("fs");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Food = require("../models/foodsModel");

dotenv.config({ path: "./config.env" });

const foods = JSON.parse(fs.readFileSync(`${__dirname}/foods.json`));
(async () => {
  try {
    await mongoose.connect(process.env.DATABASE);
    console.log("DB connect success");
  } catch (err) {
    console.log(err);
  }
})();

const importData = async (model, data) => {
  try {
    await model.insertMany(data);
    console.log("Import data success");
  } catch (err) {
    console.log(err);
  }

  mongoose.connection.close();
};

const deleteData = async (model) => {
  try {
    await model.deleteMany();
    console.log("Delete data success");
  } catch (err) {
    console.log(err);
  }

  mongoose.connection.close();
};
if (process.argv[2] === "--import-foods") importData(Food, foods);
if (process.argv[2] === "--delete-foods") deleteData(Food);
