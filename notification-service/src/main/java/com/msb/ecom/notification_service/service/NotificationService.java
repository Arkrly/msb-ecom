package com.msb.ecom.notification_service.service;

import com.msb.ecom.notification_service.event.OrderPlacedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final JavaMailSender javaMailSender;

    @KafkaListener(topics = "order-placed")
    public void listen(OrderPlacedEvent orderPlacedEvent) {
        log.info("Received message from order-placed topic: {}", orderPlacedEvent);
        try {
            sendEmail(orderPlacedEvent);
            log.info("Email sent successfully for order: {}", orderPlacedEvent.getOrderNumber());
        } catch (MailException | MessagingException e) {
            log.error("Failed to send email for order: {}", orderPlacedEvent.getOrderNumber(), e);
        }
    }

    private void sendEmail(OrderPlacedEvent event) throws MessagingException {
        MimeMessage message = javaMailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setFrom("orders@msb-ecom.com");
        helper.setTo(event.getUserEmail() != null ? event.getUserEmail() : "default@example.com");
        helper.setSubject("Order Confirmation - " + event.getOrderNumber());
        helper.setText(String.format("""
                <html>
                <body>
                    <h2>Order Confirmation</h2>
                    <p>Thank you for your order!</p>
                    <table>
                        <tr><td><strong>Order Number:</strong></td><td>%s</td></tr>
                        <tr><td><strong>Product:</strong></td><td>%s</td></tr>
                        <tr><td><strong>Quantity:</strong></td><td>%d</td></tr>
                    </table>
                    <p>We will notify you when your order ships.</p>
                </body>
                </html>
                """, event.getOrderNumber(), event.getSkuCode(), event.getQuantity()), true);

        javaMailSender.send(message);
    }
}
