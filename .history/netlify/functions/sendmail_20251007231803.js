exports.handler = async (event, context) => {
  try {
    const { name, email, subject, message } = JSON.parse(event.body);

    let transporter = nodemailer.createTransport({
      host: "smtp.zoho.eu",
      port: 465,
      secure: true,
      auth: {
        user: "info@ossence.ee",
        pass: "p9U27UKrEr4q",
      },
    });

    await transporter.sendMail({
      from: `"${name}" <info@ossence.ee>`,
      to: "info@ossence.ee",
      subject: subject || "Новое сообщение с формы",
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
