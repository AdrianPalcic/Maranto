const { Resend } = require("resend");

const apiKey = process.argv[2];
const to = process.argv[3];
const resend = new Resend(apiKey);

(async () => {
  try {
    const result = await resend.emails.send({
      from: "Maranto <rezervacije@maranto.hr>",
      to,
      reply_to: "antoniovrdoljak95@gmail.com",
      subject: "Test — Maranto booking sustav",
      html: "<p>Ovo je testni mail iz booking sustava. Ako ovo vidiš, Resend radi ispravno.</p>",
    });
    console.log("REZULTAT:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("GRESKA:", err.message || err);
  }
})();
