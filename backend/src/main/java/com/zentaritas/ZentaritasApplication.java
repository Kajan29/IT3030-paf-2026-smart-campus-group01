package com.zentaritas;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.LinkedHashSet;
import java.util.Set;

@SpringBootApplication
public class ZentaritasApplication {

    public static void main(String[] args) {
        loadDotenvToSystemProperties();
        createDatabaseIfNotExists();
        SpringApplication.run(ZentaritasApplication.class, args);
    }

    private static void createDatabaseIfNotExists() {
        String host = System.getProperty("DB_HOST");
        String port = System.getProperty("DB_PORT");
        String dbName = System.getProperty("DB_NAME");
        String username = System.getProperty("DB_USERNAME");
        String password = System.getProperty("DB_PASSWORD");

        if (host == null || port == null || dbName == null || username == null || password == null) {
            System.err.println("Warning: Database configuration missing in .env file. Skipping auto-create.");
            return;
        }

        String url = "jdbc:postgresql://" + host + ":" + port + "/postgres";

        try (Connection conn = DriverManager.getConnection(url, username, password);
             Statement stmt = conn.createStatement()) {

            ResultSet rs = stmt.executeQuery(
                "SELECT 1 FROM pg_database WHERE datname = '" + dbName + "'"
            );

            if (!rs.next()) {
                stmt.executeUpdate("CREATE DATABASE " + dbName);
                System.out.println("Database '" + dbName + "' created successfully.");
            }
        } catch (Exception e) {
            System.err.println("Warning: Could not auto-create database: " + e.getMessage());
        }
    }

    private static void loadDotenvToSystemProperties() {
        Set<Path> candidateDirectories = resolveCandidateDirectories();

        for (Path directory : candidateDirectories) {
            Path envPath = directory.resolve(".env").normalize();
            if (!Files.exists(envPath)) {
                continue;
            }

            Dotenv dotenv = Dotenv.configure()
                .directory(directory.toString())
                .ignoreIfMalformed()
                .ignoreIfMissing()
                .load();

            if (!isBackendEnv(dotenv)) {
                continue;
            }

            applyDotenvToSystemProperties(dotenv);
            break;
        }
    }

    private static Set<Path> resolveCandidateDirectories() {
        Set<Path> candidates = new LinkedHashSet<>();
        Path current = Paths.get("").toAbsolutePath().normalize();

        for (int depth = 0; depth < 7 && current != null; depth++) {
            candidates.add(current);
            candidates.add(current.resolve("backend").normalize());
            current = current.getParent();
        }

        return candidates;
    }

    private static void applyDotenvToSystemProperties(Dotenv dotenv) {
        dotenv.entries().forEach(entry -> {
            String key = entry.getKey();
            if (System.getenv(key) == null && System.getProperty(key) == null) {
                System.setProperty(key, entry.getValue());
            }
        });
    }

    private static boolean isBackendEnv(Dotenv dotenv) {
        return hasValue(dotenv.get("DB_HOST"))
            || hasValue(dotenv.get("DB_NAME"))
            || hasValue(dotenv.get("JWT_SECRET"))
            || hasValue(dotenv.get("GOOGLE_CLIENT_ID"))
            || hasValue(dotenv.get("CLOUDINARY_CLOUD_NAME"))
            || hasValue(dotenv.get("CLOUDINARY_API_KEY"))
            || hasValue(dotenv.get("CLOUDINARY_API_SECRET"));
    }

    private static boolean hasValue(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
