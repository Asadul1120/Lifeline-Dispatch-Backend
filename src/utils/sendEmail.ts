import path from "path";
import ejs from "ejs";
import { transporter } from "../lib/nodemailer.ts";
import { config } from "../config/index.ts";

type SendEmailOptions = {
  to: string;
  subject: string;
  templateName: string;
  templateData: Record<string, unknown>;
};

export const sendEmail = async ({
  to,
  subject,
  templateName,
  templateData,
}: SendEmailOptions) => {
  try {
    const templatePath = path.join(
      process.cwd(),
      `src/templates/${templateName}.ejs`,
    );

    const html = await ejs.renderFile(templatePath, templateData);

    const info = await transporter.sendMail({
      from: "Lifeline Dispatch",
      to,
      subject,
      html,
    });

    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
