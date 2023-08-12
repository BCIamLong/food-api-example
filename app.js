const express = require("express");
const morgan = require("morgan");
const foodsRouter = require("./routes/foodsRouter");

const app = express();

app.use(morgan("dev"));
app.use(express.json());

app.use("/api/v1/foods", foodsRouter);

module.exports = app;
