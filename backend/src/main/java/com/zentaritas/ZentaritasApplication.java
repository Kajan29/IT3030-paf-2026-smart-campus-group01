package com.zentaritas;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashSet;
import java.util.Set;

@SpringBootApplication
public class ZentaritasApplication {

    public static void main(String[] args) {
        loadDotenvToSystemProperties();
        SpringApplication.run(ZentaritasApplication.class, args);
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
}
