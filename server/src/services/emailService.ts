import nodemailer from 'nodemailer';
import { env } from '../config/env';

export const isSmtpConfigured = (): boolean =>
  Boolean(env.smtp.host && env.smtp.user && env.smtp.pass && env.smtp.from);

export async function sendPasswordResetEmail(
  to: string,
  displayName: string,
  resetUrl: string
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass
    }
  });

  const safeName = displayName.trim() || 'usuario';

  await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject: 'Restablece tu contraseña — FlorteApp',
    text: [
      `Hola ${safeName},`,
      '',
      'Recibimos una solicitud para restablecer la contraseña de tu cuenta en FlorteApp.',
      `Abre este enlace (válido por 1 hora): ${resetUrl}`,
      '',
      'Si no fuiste tú, ignora este mensaje.',
      '',
      '— Equipo FlorteApp'
    ].join('\n'),
    html: `
      <p>Hola ${escapeHtml(safeName)},</p>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>FlorteApp</strong>.</p>
      <p><a href="${escapeHtml(resetUrl)}">Restablecer contraseña</a></p>
      <p style="color:#666;font-size:13px;">Si el enlace no funciona, copia y pega esta URL en el navegador:<br/>
      <span style="word-break:break-all;">${escapeHtml(resetUrl)}</span></p>
      <p style="color:#666;font-size:13px;">Si no fuiste tú, puedes ignorar este correo.</p>
    `
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
