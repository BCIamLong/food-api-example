const AppError = require("../utils/AppError");

const sendErrorsDevHandler = (err, res) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  console.log(err.statusCode);
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorsProdHandler = (err, res) => {
  if (err.isOperational)
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

  res.status(500).json({
    status: "error",
    message: "Something went wrong",
  });
};

const duplicateErrorHandler = err =>
  new AppError(`The ${Object.keys(err.keyValue)[0]} was exits`, 400);
const validationErrorHandler = err =>
  new AppError(
    `${Object.values(err.errors)
      .map(el => el.message)
      .join(". s")}`,
    400,
  );
const castErrorHandler = err =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const JWTErrorHandler = () =>
  new AppError("Your access is invalid, please check and login again", 401);

const JWTExpiresErrorHandler = () =>
  new AppError("Your login turn was expires, please login again", 401);

module.exports = (err, req, res, next) => {
  if (process.env.NODE_ENV === "development") sendErrorsDevHandler(err, res);
  if (process.env.NODE_ENV === "production") {
    let errProd = { ...err };
    if (errProd.code && errProd.code === 11000)
      errProd = duplicateErrorHandler(errProd);
    if (errProd._message && errProd._message === "Validation failed")
      errProd = validationErrorHandler(errProd);
    if (errProd.reason?.name === "BSONError")
      errProd = castErrorHandler(errProd);
    if (errProd.name === "JsonWebTokenError") errProd = JWTErrorHandler();
    if (errProd.name === "TokenExpiredError")
      errProd = JWTExpiresErrorHandler();
    sendErrorsProdHandler(errProd, res);
  }
};
