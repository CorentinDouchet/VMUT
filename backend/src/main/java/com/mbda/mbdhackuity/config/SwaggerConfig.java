package com.mbda.mbdhackuity.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        Server devServer = new Server();
        devServer.setUrl("http://localhost:8080");
        devServer.setDescription("Serveur de développement");

        Contact contact = new Contact();
        contact.setEmail("support@mbda.com");
        contact.setName("MBDA Support");
        contact.setUrl("https://www.mbda-systems.com");

        License mitLicense = new License()
                .name("MIT License")
                .url("https://choosealicense.com/licenses/mit/");

        Info info = new Info()
                .title("MBDhackuity API - Gestion des Vulnérabilités CVE")
                .version("1.0.0")
                .contact(contact)
                .description("API REST complète pour la gestion des vulnérabilités de sécurité (CVE). " +
                        "Permet l'import de scans Cyberwatch/OpenVAS, l'analyse des vulnérabilités, " +
                        "le calcul CVSS, la justification et l'export de rapports.")
                .termsOfService("https://www.mbda-systems.com/terms")
                .license(mitLicense);

        return new OpenAPI()
                .openapi("3.0.1")
                .info(info)
                .servers(List.of(devServer));
    }
}
