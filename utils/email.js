const nodemailer = require("nodemailer");

const sendEmail = async options => {
  const transposter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const optionsInfo = {
    from: "longhoang <longhoang@gmail.com>",
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  await transposter.sendMail(optionsInfo);
};

module.exports = { sendEmail };
