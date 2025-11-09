package com.example.finfam.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${frontend.url}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendInvitationEmail(String toEmail, String inviterName, String familyName, String inviteToken) {
        try {
            String invitationUrl = frontendUrl + "/accept-invitation?token=" + inviteToken;
            
            String htmlContent = buildInvitationEmailHtml(inviterName, familyName, invitationUrl);
            
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(toEmail);
            helper.setSubject("Convite para família: " + familyName);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
        } catch (MailException | MessagingException e) {
            throw new RuntimeException("Falha ao enviar email de convite", e);
        }
    }

    private String buildInvitationEmailHtml(String inviterName, String familyName, String invitationUrl) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                    .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Convite para FinFam</h1>
                    </div>
                    <div class="content">
                        <p>Olá!</p>
                        <p><strong>%s</strong> convidou você para participar da família <strong>%s</strong> no FinFam.</p>
                        <p>Clique no botão abaixo para aceitar o convite e começar a gerenciar suas finanças junto com sua família:</p>
                        <p style="text-align: center;">
                            <a href="%s" class="button">Aceitar Convite</a>
                        </p>
                        <p style="color: #6b7280; font-size: 14px;">
                            Se você não esperava este convite, pode ignorar este email.
                        </p>
                        <p style="color: #6b7280; font-size: 14px;">
                            Este link expira em 7 dias.
                        </p>
                    </div>
                    <div class="footer">
                        <p>FinFam - Gestão Financeira Familiar</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(inviterName, familyName, invitationUrl);
    }
}

