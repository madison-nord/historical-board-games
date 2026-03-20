package com.ninemensmorris;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main entry point for the Nine Men's Morris application.
 * Enables Spring scheduling for periodic game cleanup tasks.
 */
@SpringBootApplication
@EnableScheduling
public class NineMensMorrisApplication {
    public static void main(String[] args) {
        SpringApplication.run(NineMensMorrisApplication.class, args);
    }
}
