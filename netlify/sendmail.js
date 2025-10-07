const nodemailer = require("nodemailer");

exports.handler = async (event) => {
  const data = JSON.parse(event.body);

  let transporter = nodemailer.createTransport({
    host: "smtp.zoho.eu",
    port: 465,
    secure: true,
    auth: {
      user: "info@ossence.ee",
      pass: "ТВОЙ_ПАРОЛЬ_ИЛИ_APP_PASSWORD",
    },
  });

  await transporter.sendMail({
    from: '"Форма сайта" <info@ossence.ee>',
    to: "info@ossence.ee",
    subject: data.subject || "Сообщение с формы",
    text: data.message,
    replyTo: data.email,
  });

  return { statusCode: 200, body: "OK" };
};
