const mongoose = require("mongoose");
const validator = require("validator");

const foodsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Food must have a name"],
      trim: true,
      maxLength: [30, "Food name must less than equals 30 characters"],
      minLength: [3, "Food name must greater than equals 3 characters"],
      unique: true,
    },
    decription: {
      type: String,
      required: [true, "Food must have a decription"],
    },
    price: {
      type: Number,
      required: [true, "Food must have a price"],
      max: [10000, "Food price must not too expensive"],
      validate: {
        //!WHEN YOU RUN IN UPDATE ACTION THE THIS KEYWORD NOT POINTING TO CURRENT DOCUMENT, IT'S POINTING DOCUENT WHEN WE CREATE
        //!when You check data when get an error, First you need check data, then check code,...
        validator: function (val) {
          // console.log(this);
          // return val >= Math.round(val - val * (this.discount / 100));
          return val;
        },
        message: "The price must to greater than equals discount price",
      },
    },
    category: {
      type: String,
      required: [true, "Food must have a category"],
      enum: {
        values: ["sweet", "cake", "dishes", "juice"],
        message: "Food category either sweet ,cake, dishes, juice ",
      },
    },
    recipes: {
      type: String,
      required: [true, "Food must have  recipes"],
    },
    ingredients: {
      type: String,
      required: [true, "Food must have ingredients"],
    },
    discount: {
      type: Number,
      max: 20,
    },
    brand: {
      type: String,
      required: [true, "Food must have a brand"],
    },
    email: {
      type: String,
      trim: true,
      validate: [validator.isEmail, "Email must have email type"],
    },
    vip: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    toJSON: { virtuals: true },
  },
);

foodsSchema.pre("save", function (next) {
  //!save not effect to inSertMany, insertOne
  // console.log(this.brand.replaceAll(" ", ""));
  this.email = `${this.brand.replaceAll(" ", "").toLowerCase()}.gmail.com`;
  if (this.price > 1000) this.vip = true;
  next();
});

foodsSchema.virtual("discountPrice").get(function () {
  return Math.round(this.price - this.price * (this.discount / 100));
});

foodsSchema.virtual("Currency").get(function () {
  return [
    { dollars: this.price },
    { VND: this.price * 22000 },
    { KWR: this.price * 1300 },
  ];
});

const Food = mongoose.model("Food", foodsSchema);

module.exports = Food;
