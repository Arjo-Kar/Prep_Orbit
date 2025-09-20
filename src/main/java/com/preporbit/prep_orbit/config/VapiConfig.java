package com.preporbit.prep_orbit.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class VapiConfig {

    @Value("${vapi.private.key:}")
    private String privateKey;

    @Value("${vapi.public.key:}")
    private String publicKey;

    @Value("${vapi.webhook.url:}")
    private String webhookUrl;

    @Value("${vapi.base.url:https://api.vapi.ai}")
    private String baseUrl;

    public String getPrivateKey() {
        String key = (privateKey != null && !privateKey.isBlank())
                ? privateKey
                : System.getenv("VAPI_PRIVATE_KEY");

        if (key == null || key.isBlank()) {
            throw new IllegalStateException(
                    "VAPI_PRIVATE_KEY not configured: please set it in application.properties or as an environment variable."
            );
        }
        return key;
    }

    public String getPublicKey() {
        String key = (publicKey != null && !publicKey.isBlank())
                ? publicKey
                : System.getenv("VAPI_PUBLIC_KEY");

        if (key == null || key.isBlank()) {
            throw new IllegalStateException(
                    "VAPI_PUBLIC_KEY not configured: please set it in application.properties or as an environment variable."
            );
        }
        return key;
    }

    public String getWebhookUrl() {
        return webhookUrl != null && !webhookUrl.isBlank() ? webhookUrl : null;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public boolean hasWebhook() {
        return webhookUrl != null && !webhookUrl.isBlank();
    }

    public boolean isConfigured() {
        try {
            getPrivateKey();
            getPublicKey();
            return true;
        } catch (IllegalStateException e) {
            return false;
        }
    }
}