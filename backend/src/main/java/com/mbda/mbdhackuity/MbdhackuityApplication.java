package com.mbda.mbdhackuity;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MbdhackuityApplication {

    public static void main(String[] args) {
        SpringApplication.run(MbdhackuityApplication.class, args);
        System.out.println("\n🚀 MBDhackuity démarré sur http://localhost:8080");
        System.out.println("📚 API disponible sur http://localhost:8080/api");
        System.out.println("📖 Swagger UI: http://localhost:8080/swagger-ui.html");
        System.out.println("❤️  Health check: http://localhost:8080/actuator/health\n");
    }
}