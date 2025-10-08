// const nodemailer = require("nodemailer");

// exports.handler = async (event, context) => {
//   try {
//     console.log("=== ФУНКЦИЯ START ===");
//     console.log("HTTP Method:", event.httpMethod);
//     console.log("Raw body:", event.body);

//     if (!event.body) {
//       console.error("Пустое тело запроса");
//       return {
//         statusCode: 400,
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ success: false, error: "Пустое тело запроса" }),
//       };
//     }

//     const { name, email, subject, message } = JSON.parse(event.body);
//     console.log("Данные из формы:", { name, email, subject, message });

//     // Настройка Zoho SMTP
//     let transporter = nodemailer.createTransport({
//       host: "smtp.zoho.eu",
//       port: 465,
//       secure: true,
//       auth: {
//         user: "info@ossence.ee", // твой Zoho адрес
//         pass: "p9U27UKrEr4q", // пароль приложения Zoho
//       },
//     });

//     console.log("Транспорт создан, начинаем отправку...");

//     await transporter.sendMail({
//       from: `"${name}" <info@ossence.ee>`,
//       to: "info@ossence.ee",
//       subject: subject || "Новое сообщение с формы",
//       text: `От: ${name} (${email})\n\n${message}`,
//     });

//     console.log("✅ Письмо успешно отправлено!");

//     return {
//       statusCode: 200,
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ success: true, message: "Письмо отправлено!" }),
//     };
//   } catch (error) {
//     console.error("❌ Ошибка при обработке:", error);

//     return {
//       statusCode: 500,
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ success: false, error: error.message }),
//     };
//   }
// };

// --- Enhanced handler override to support date/time fields ---
exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { Allow: "POST" },
        body: "Method Not Allowed",
      };
    }

    const payload = JSON.parse(event.body || "{}");
    const { name, email, subject, message, preferredDate, preferredTime } =
      payload;

    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      host: "smtp.zoho.eu",
      port: 465,
      secure: true,
      auth: { user: "info@ossence.ee", pass: "p9U27UKrEr4q" },
    });

    const when = [preferredDate, preferredTime].filter(Boolean).join(" ");
    const text = `От: ${name} (${email})${
      when ? `\n\nПредпочтительное время: ${when}` : ""
    }\n\n${message}`;

    await transporter.sendMail({
      from: `"${name}" <info@ossence.ee>`,
      to: "info@ossence.ee",
      subject: (subject || "Сообщение с сайта") + (when ? ` • ${when}` : ""),
      text,
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
