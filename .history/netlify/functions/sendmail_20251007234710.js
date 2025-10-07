exports.handler = async (event, context) => {
  try {
    // Логируем, что вообще пришло
    console.log("HTTP Method:", event.httpMethod);
    console.log("Headers:", event.headers);
    console.log("Raw body:", event.body);

    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: "Пустое тело запроса" }),
      };
    }

    const { name, email, subject, message } = JSON.parse(event.body);

    let transporter = nodemailer.createTransport({
      host: "smtp.zoho.eu",
      port: 465,
      secure: true,
      auth: {
        user: "info@ossence.ee",
        pass: "p9U27UKrEr4q", // лучше потом вынести в переменные окружения
      },
    });

    await transporter.sendMail({
      from: `"${name}" <info@ossence.ee>`,
      to: "info@ossence.ee",
      subject: subject || "Новое сообщение с формы",
      text: `От: ${name} (${email})\n\n${message}`,
    });

    console.log("Письмо успешно отправлено!");

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Письмо отправлено!" }),
    };
  } catch (error) {
    console.error("Ошибка при отправке:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
