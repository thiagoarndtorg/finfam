package com.example.finfam; // Replace with your package name

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;

@SpringBootApplication
public class FinFamApplication {
    public static void main(String[] args) {
        SpringApplication.run(FinFamApplication.class, args);
    }
}