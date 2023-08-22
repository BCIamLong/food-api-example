const express = require("express");
const morgan = require("morgan");
const foodsRouter = require("./routes/foodsRouter");
const usersRouter = require("./routes/userRouter");
const AppError = require("./utils/AppError");
const errorsHandler = require("./middleware/errorsHandler");

const app = express();

app.use(morgan("dev"));
app.use(express.json());

app.use("/api/v1/users", usersRouter);
app.use("/api/v1/foods", foodsRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Invalid link: ${req.originalUrl}`, 404));
});

app.use(errorsHandler);
module.exports = app;
