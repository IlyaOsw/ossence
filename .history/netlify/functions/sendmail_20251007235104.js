const nodemailer = require("nodemailer");

exports.handler = async (event, context) => {
  try {
    console.log("=== ФУНКЦИЯ START ===");
    console.log("HTTP Method:", event.httpMethod);
    console.log("Raw body:", event.body);

    if (!event.body) {
      console.error("Пустое тело запроса");
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: "Пустое тело запроса" }),
      };
    }

    const { name, email, subject, message } = JSON.parse(event.body);
    console.log("Данные из формы:", { name, email, subject, message });

    // Настройка Zoho SMTP
    let transporter = nodemailer.createTransport({
      host: "smtp.zoho.eu",
      port: 465,
      secure: true,
      auth: {
        user: "info@ossence.ee", // твой Zoho адрес
        pass: "ПАРОЛЬ_ПРИЛОЖЕНИЯ", // пароль приложения из Zoho!
      },
    });

    console.log("Транспорт создан, начинаем отправку...");

    await transporter.sendMail({
      from: `"${name}" <info@ossence.ee>`,
      to: "info@ossence.ee",
      subject: subject || "Новое сообщение с формы",
      text: `От: ${name} (${email})\n\n${message}`,
    });

    console.log("✅ Письмо успешно отправлено!");

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Письмо отправлено!" }),
    };
  } catch (error) {
    console.error("❌ Ошибка при обработке:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
