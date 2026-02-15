package com.msb.ecom.notification_service;

import com.msb.ecom.notification_service.event.OrderPlacedEvent;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.serializer.JsonSerializer;
import org.springframework.mail.javamail.JavaMailSender;
import org.testcontainers.containers.KafkaContainer;
import org.testcontainers.utility.DockerImageName;

import jakarta.mail.internet.MimeMessage;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

import static org.awaitility.Awaitility.await;
import static org.mockito.Mockito.*;

@SpringBootTest(properties = {
        "spring.mail.host=localhost",
        "spring.mail.port=1025"
})
class NotificationServiceApplicationTests {

    @ServiceConnection
    static KafkaContainer kafkaContainer = new KafkaContainer(
            DockerImageName.parse("confluentinc/cp-kafka:7.5.0"));

    @MockBean
    private JavaMailSender javaMailSender;

    static {
        kafkaContainer.start();
    }

    private KafkaTemplate<String, OrderPlacedEvent> createProducer() {
        Map<String, Object> producerProps = new HashMap<>();
        producerProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, kafkaContainer.getBootstrapServers());
        producerProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        producerProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        producerProps.put(JsonSerializer.TYPE_MAPPINGS,
                "orderPlacedEvent:com.msb.ecom.notification_service.event.OrderPlacedEvent");
        return new KafkaTemplate<>(new DefaultKafkaProducerFactory<>(producerProps));
    }

    @Test
    void shouldReceiveOrderPlacedEventAndSendEmail() {
        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(javaMailSender.createMimeMessage()).thenReturn(mimeMessage);

        KafkaTemplate<String, OrderPlacedEvent> kafkaTemplate = createProducer();

        OrderPlacedEvent event = new OrderPlacedEvent(
                "ORD-12345", "iphone_15", 2, "test@example.com");
        kafkaTemplate.send("order-placed", event);

        await().atMost(Duration.ofSeconds(30)).untilAsserted(() -> {
            verify(javaMailSender, atLeastOnce()).createMimeMessage();
            verify(javaMailSender, atLeastOnce()).send(any(MimeMessage.class));
        });
    }

    @Test
    void shouldReceiveEventWithNullEmailAndUseDefault() {
        // Reset mock to get clean counts for this test
        reset(javaMailSender);
        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(javaMailSender.createMimeMessage()).thenReturn(mimeMessage);

        KafkaTemplate<String, OrderPlacedEvent> kafkaTemplate = createProducer();

        OrderPlacedEvent event = new OrderPlacedEvent("ORD-67890", "samsung_s24", 1, null);
        kafkaTemplate.send("order-placed", event);

        await().atMost(Duration.ofSeconds(30)).untilAsserted(() -> {
            verify(javaMailSender, atLeastOnce()).createMimeMessage();
            verify(javaMailSender, atLeastOnce()).send(any(MimeMessage.class));
        });
    }
}
