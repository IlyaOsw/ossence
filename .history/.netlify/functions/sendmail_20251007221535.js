const nodemailer = require("nodemailer");

exports.handler = async (event, context) => {
  try {
    const { name, email, message } = JSON.parse(event.body);

    // Настройка Zoho SMTP
    let transporter = nodemailer.createTransport({
      host: "smtp.zoho.eu",
      port: 465,
      secure: true,
      auth: {
        user: "info@ossence.ee", // твой адрес Zoho
        pass: "ТВОЙ_ПАРОЛЬ", // пароль приложения Zoho (не обычный пароль!)
      },
    });

    // Формируем письмо
    await transporter.sendMail({
      from: `"${name}" <info@ossence.ee>`,
      to: "info@ossence.ee", // можешь поставить свой email
      subject: "Новое сообщение с формы",
      text: `От: ${name} (${email})\n\n${message}`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Письмо отправлено!" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
