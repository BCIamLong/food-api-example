const express = require("express");
const morgan = require("morgan");
const bodyPaser = require("body-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const cookiePaser = require("cookie-parser");
const foodsRouter = require("./routes/foodsRouter");
const usersRouter = require("./routes/userRouter");
const AppError = require("./utils/AppError");
const errorsHandler = require("./middleware/errorsHandler");

const app = express();

app.use(helmet());

app.use(cookiePaser());

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));
// app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: "Too much request, please wait and send again",
});

app.use(limiter);

app.use(bodyPaser.json({ limit: "90kb" }));

app.use(mongoSanitize());

app.use(hpp());

app.use("/api/v1/users", usersRouter);
app.use("/api/v1/foods", foodsRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Invalid link: ${req.originalUrl}`, 404));
});

app.use(errorsHandler);
module.exports = app;
