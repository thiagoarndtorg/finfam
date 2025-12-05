package com.example.finfam.service;

import com.example.finfam.dto.response.AuthenticationResponse;
import com.example.finfam.dto.request.LoginRequest;
import com.example.finfam.dto.request.RegisterRequest;
import com.example.finfam.exception.CustomException;
import com.example.finfam.model.Family;
import com.example.finfam.model.FamilyMember;
import com.example.finfam.model.User;
import com.example.finfam.repository.FamilyMemberRepository;
import com.example.finfam.repository.FamilyRepository;
import com.example.finfam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AuthenticationService {
    private final UserRepository userRepository;
    private final FamilyRepository familyRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    public void register(RegisterRequest request) {
        // Validate input fields
        if (request.getEmail() == null || request.getEmail().isEmpty() ||
                request.getUsername() == null || request.getUsername().isEmpty() ||
                request.getPassword() == null || request.getPassword().isEmpty()) {
            throw new CustomException("Todos os campos são necessários");
        }

        // Validate email format
        String emailRegex = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";
        Pattern pattern = Pattern.compile(emailRegex);
        if (!pattern.matcher(request.getEmail()).matches()) {
            throw new CustomException("Email inválido");
        }

        // Check if email is already taken
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new CustomException("Usuário já registrado com este email");
        }

        // Generate verification token
        String verificationToken = UUID.randomUUID().toString();

        // Create the user
        var user = User.builder()
                .email(request.getEmail())
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .emailVerified(false)
                .verificationToken(verificationToken)
                .familyMemberships(new ArrayList<>()) // Initialize empty list
                .build();
        user = userRepository.save(user);

        // Create a solo family
        Family family = new Family();
        family.setName(request.getUsername() + "'s Family");
        family.setCreatedBy(user);
        family = familyRepository.save(family);

        // Link user to family as admin
        FamilyMember familyMember = new FamilyMember();
        familyMember.setFamily(family);
        familyMember.setUser(user);
        familyMember.setRole(FamilyMember.Role.ADMIN); // First user is admin
        familyMember.setStatus(FamilyMember.Status.ACTIVE);
        familyMemberRepository.save(familyMember);

        // Send verification email
        emailService.sendVerificationEmail(user.getEmail(), user.getUsername(), verificationToken);
    }

    public AuthenticationResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
        } catch (Exception e) {
            throw new CustomException("Email ou senha inválidos");
        }
        var user = userRepository.findByEmail(request.getEmail()).orElseThrow();
        
        // Check if email is verified (only for non-Google users)
        if (user.getGoogleId() == null && (user.getEmailVerified() == null || !user.getEmailVerified())) {
            throw new CustomException("Por favor, verifique seu email antes de fazer login");
        }
        
        var jwtToken = jwtService.generateToken(user.getId(), user.getEmail());
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .username(user.getUsername())
                .email(user.getEmail())
                .avatar_url(user.getAvatarUrl())
                .build();
    }

    public void verifyEmail(String token) {
        var user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new CustomException("Token de verificação inválido ou expirado"));
        
        user.setEmailVerified(true);
        user.setVerificationToken(null);
        userRepository.save(user);
    }

    public AuthenticationResponse googleLogin(String googleId, String email, String name, String picture) {
        // Check if user exists with this Google ID
        var existingUser = userRepository.findByGoogleId(googleId);
        
        User user;
        if (existingUser.isPresent()) {
            user = existingUser.get();
        } else {
            // Check if user exists with this email (but different auth method)
            var userByEmail = userRepository.findByEmail(email);
            if (userByEmail.isPresent()) {
                // Link Google account to existing user
                user = userByEmail.get();
                user.setGoogleId(googleId);
                user.setEmailVerified(true); // Google emails are pre-verified
                userRepository.save(user); // Save the updated user
            } else {
                // Create new user
                // Generate a random password for Google users (they won't use it)
                String randomPassword = UUID.randomUUID().toString();
                user = User.builder()
                        .email(email)
                        .username(name)
                        .password(passwordEncoder.encode(randomPassword)) // Google users don't need password, but UserDetails requires it
                        .googleId(googleId)
                        .emailVerified(true) // Google emails are pre-verified
                        .avatarUrl(picture)
                        .familyMemberships(new ArrayList<>())
                        .build();
                user = userRepository.save(user);

                // Create a solo family
                Family family = new Family();
                family.setName(name + "'s Family");
                family.setCreatedBy(user);
                family = familyRepository.save(family);

                // Link user to family as admin
                FamilyMember familyMember = new FamilyMember();
                familyMember.setFamily(family);
                familyMember.setUser(user);
                familyMember.setRole(FamilyMember.Role.ADMIN);
                familyMember.setStatus(FamilyMember.Status.ACTIVE);
                familyMemberRepository.save(familyMember);
            }
        }

        var jwtToken = jwtService.generateToken(user.getId(), user.getEmail());
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .username(user.getUsername())
                .avatar_url(user.getAvatarUrl())
                .email(user.getEmail())
                .build();
    }
}