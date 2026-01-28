import nodemailer from "nodemailer";
import * as fs from "fs";
import * as path from "path";
import { convert } from "html-to-text";
import Handlebars, { TemplateDelegate } from "handlebars";
import { SupportedLanguage } from "../types";
import { translate, DEFAULT_LANGUAGE } from "./i18n";

interface EmailConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
}

function createTransporter() {
  const config: EmailConfig = {};

  if (process.env.MAILSLURP_API_KEY) {
    config.host = process.env.MAILSLURP_SMTP_HOST || "smtp.mailslurp.com";
    config.port = parseInt(process.env.MAILSLURP_SMTP_PORT || "587", 10);
    config.secure = process.env.MAILSLURP_SMTP_SECURE === "true";
    
    if (process.env.MAILSLURP_SMTP_USER && process.env.MAILSLURP_SMTP_PASS) {
      config.auth = {
        user: process.env.MAILSLURP_SMTP_USER,
        pass: process.env.MAILSLURP_SMTP_PASS,
      };
    } else {
      config.auth = {
        user: process.env.MAILSLURP_SMTP_USER || "mailslurp",
        pass: process.env.MAILSLURP_API_KEY,
      };
    }
  } else if (process.env.SMTP_HOST) {
    config.host = process.env.SMTP_HOST;
    config.port = parseInt(process.env.SMTP_PORT || "587", 10);
    config.secure = process.env.SMTP_SECURE === "true";
    
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      config.auth = {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      };
    }
  }

  if (Object.keys(config).length === 0) {
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: "ethereal.user@ethereal.email",
        pass: "ethereal.pass",
      },
    });
  }

  return nodemailer.createTransport(config);
}

const transporter = createTransporter();

Handlebars.registerHelper('eq', function(a: any, b: any) {
  return a === b;
});

Handlebars.registerHelper('ne', function(a: any, b: any) {
  return a !== b;
});

Handlebars.registerHelper('uppercase', function(str: string) {
  return str ? str.toUpperCase() : '';
});

Handlebars.registerHelper('lowercase', function(str: string) {
  return str ? str.toLowerCase() : '';
});

function loadTemplate(templateName: string): TemplateDelegate {
  let templatePath: string;
  
  if (__filename.endsWith('.js')) {
    templatePath = path.join(__dirname, "../templates/email", `${templateName}.html`);
  } else {
    templatePath = path.join(__dirname, "../templates/email", `${templateName}.html`);
  }
  
  try {
    const templateSource = fs.readFileSync(templatePath, "utf8");
    return Handlebars.compile(templateSource);
  } catch (error: any) {
    throw new Error(`Template ${templateName}.html não encontrado`);
  }
}

function htmlToText(html: string): string {
  return convert(html, {
    wordwrap: 80,
    preserveNewlines: true,
    selectors: [
      { selector: 'a', options: { ignoreHref: false } },
      { selector: 'img', format: 'skip' }
    ]
  });
}

function renderTemplate(template: TemplateDelegate, variables: Record<string, any>): string {
  return template(variables);
}

function getWelcomeEmailTemplate(user: { name: string; email: string; type: string }, language: SupportedLanguage): { subject: string; html: string; text: string } {
  const t = (key: string) => translate(language, key);

  const subject = t("email.welcome.subject");
  const userName = user.name;
  const userEmail = user.email;
  const userType = user.type;

  const template = loadTemplate("welcome");

  const variables = {
    title: t("email.welcome.title"),
    greeting: t("email.welcome.greeting").replace("{name}", userName),
    message: t("email.welcome.message"),
    emailLabel: t("email.welcome.email"),
    userEmail: userEmail,
    typeLabel: t("email.welcome.type"),
    userType: userType,
    footer: t("email.welcome.footer"),
    signature: t("email.welcome.signature")
  };

  const html = renderTemplate(template, variables);
  const text = htmlToText(html);

  return { subject, html, text };
}

export async function sendWelcomeEmail(user: { name: string; email: string; type: string; language: SupportedLanguage }): Promise<void> {
  try {
    const language = user.language || DEFAULT_LANGUAGE;
    let fromEmail = process.env.EMAIL_FROM || "noreply@spsgroup.com.br";
    const fromName = process.env.EMAIL_FROM_NAME || "SPS Group";

    if (process.env.MAILSLURP_API_KEY) {
      try {
        const response = await fetch("https://api.mailslurp.com/inboxes", {
          method: "POST",
          headers: {
            "x-api-key": process.env.MAILSLURP_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });

        if (response.ok) {
          const inbox = await response.json() as { emailAddress?: string };
          fromEmail = inbox.emailAddress || fromEmail;
        }
      } catch (error: any) {
        throw new Error("EMAIL_CONFIG_NOT_VERIFIED");
      }
    }

    const { subject, html, text } = getWelcomeEmailTemplate(user, language);

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: user.email,
      subject,
      html,
      text,
    };

    if (process.env.NODE_ENV === "development" && !process.env.SMTP_HOST && !process.env.MAILSLURP_API_KEY) {
      try {
         await transporter.sendMail(mailOptions);
      } catch (error: any) {
        throw new Error("EMAIL_SEND_FAILED");
      }
      return;
    }

     await transporter.sendMail(mailOptions);
    
  } catch (error: any) {
    throw new Error("EMAIL_SEND_FAILED");
  }
}

export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    throw new Error("EMAIL_CONFIG_NOT_VERIFIED");
  }
}

function getPasswordResetEmailTemplate(user: { name: string; email: string }, resetToken: string, language: SupportedLanguage): { subject: string; html: string; text: string } {
  const t = (key: string) => translate(language, key);
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

  const subject = t("email.password_reset.subject");
  const userName = user.name;

  const template = loadTemplate("password-reset");

  const variables = {
    title: t("email.password_reset.title"),
    greeting: t("email.password_reset.greeting").replace("{name}", userName),
    message: t("email.password_reset.message"),
    resetUrl: resetUrl,
    button: t("email.password_reset.button"),
    alternative: t("email.password_reset.alternative"),
    resetToken: resetToken,
    expires: t("email.password_reset.expires"),
    warning: t("email.password_reset.warning"),
    signature: t("email.password_reset.signature"),
    link: t("email.password_reset.link")
  };

  const html = renderTemplate(template, variables);
  const text = htmlToText(html);

  return { subject, html, text };
}

export async function sendPasswordResetEmail(user: { name: string; email: string; language: SupportedLanguage }, resetToken: string): Promise<void> {
  try {
    const language = user.language || DEFAULT_LANGUAGE;
    let fromEmail = process.env.EMAIL_FROM || "noreply@spsgroup.com.br";
    const fromName = process.env.EMAIL_FROM_NAME || "SPS Group";

    if (process.env.MAILSLURP_API_KEY) {
      try {
        const response = await fetch("https://api.mailslurp.com/inboxes", {
          method: "POST",
          headers: {
            "x-api-key": process.env.MAILSLURP_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });

        if (response.ok) {
          const inbox = await response.json() as { emailAddress?: string };
          fromEmail = inbox.emailAddress || fromEmail;
        }
      } catch (error: any) {
        throw new Error("EMAIL_CONFIG_NOT_VERIFIED");
      }
    }

    const { subject, html, text } = getPasswordResetEmailTemplate(user, resetToken, language);

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: user.email,
      subject,
      html,
      text,
    };

    if (process.env.NODE_ENV === "development" && !process.env.SMTP_HOST && !process.env.MAILSLURP_API_KEY) {
      try {
        await transporter.sendMail(mailOptions);
      } catch (error: any) {
        throw new Error("EMAIL_SEND_FAILED");
      }
      return;
    }

     await transporter.sendMail(mailOptions);
  } catch (error: any) {
    throw new Error("EMAIL_SEND_FAILED");
  }
}
