package com.streetpulse.controller;

import com.streetpulse.model.User;
import com.streetpulse.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Real account system: registration and login backed by the database, with BCrypt-hashed
 * passwords. The app's data is public, so there are no protected routes — sign-in simply
 * personalises the experience and proves the account flow end-to-end.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String name = trim(body.get("name"));
        String email = trim(body.get("email")).toLowerCase();
        String password = body.get("password") == null ? "" : body.get("password");

        if (name.isBlank()) return bad("Please enter your name.");
        if (!EMAIL.matcher(email).matches()) return bad("Please enter a valid email address.");
        if (password.length() < 6) return bad("Password must be at least 6 characters.");
        if (userRepository.existsByEmailIgnoreCase(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "An account with that email already exists."));
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPasswordHash(encoder.encode(password));
        user.setCreatedAt(LocalDateTime.now());
        userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("name", name, "email", email));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = trim(body.get("email")).toLowerCase();
        String password = body.get("password") == null ? "" : body.get("password");

        return userRepository.findByEmailIgnoreCase(email)
            .filter(u -> encoder.matches(password, u.getPasswordHash()))
            .<ResponseEntity<?>>map(u -> ResponseEntity.ok(Map.of("name", u.getName(), "email", u.getEmail())))
            .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Incorrect email or password.")));
    }

    private static String trim(String s) { return s == null ? "" : s.trim(); }

    private static ResponseEntity<Map<String, String>> bad(String msg) {
        return ResponseEntity.badRequest().body(Map.of("error", msg));
    }
}
