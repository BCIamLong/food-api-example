class APIFeature {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  filter() {
    const obQuery = { ...this.queryStr };
    const options = ["fields", "sort", "limit", "page"];
    options.forEach((el) => delete obQuery[el]);

    //{duration: {gte: 3}} => {duration: {$gte: 3}}
    let operatorStr = JSON.stringify(obQuery);
    //*https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace
    operatorStr = operatorStr.replace(
      /\b(gte|lte|gt|lt)\b/g,
      (match) => `$${match}`
    );
    this.query = this.query.find(JSON.parse(operatorStr));

    return this;
  }

  sort() {
    if (this.queryStr.sort) {
      //sort=price,-rating,... => price -rating
      const sortStr = this.queryStr.sort.replaceAll(",", " ");
      // you also use split().join() but it's lower and use than cpu but it's very small
      //--> in you project it's not really important but if you work for a companny when you build big project it'ss maybe a problem

      this.query = this.query.sort(sortStr);
    } else this.query = this.query.sort("-createdAt");

    return this;
  }

  select() {
    if (this.queryStr.fields) {
      const fieldsStr = this.queryStr.fields.replaceAll(",", " ");
      this.query = this.query.select(fieldsStr);
    } else this.query = this.query.select("-__v");

    return this;
  }

  pagination(count) {
    const page = this.queryStr.page || 1;
    const limit = this.queryStr.limit || 10;
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(count / limit);
    if (page <= totalPages) this.query = this.query.skip(skip).limit(limit);
    else throw new Error("Page invalid");

    return this;
  }
}

module.exports = APIFeature;
