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
  
        if (request.getEmail() == null || request.getEmail().isEmpty() ||
                request.getUsername() == null || request.getUsername().isEmpty() ||
                request.getPassword() == null || request.getPassword().isEmpty()) {
            throw new CustomException("Todos os campos são necessários");
        }


        String emailRegex = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";
        Pattern pattern = Pattern.compile(emailRegex);
        if (!pattern.matcher(request.getEmail()).matches()) {
            throw new CustomException("Email inválido");
        }

    
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new CustomException("Usuário já registrado com este email");
        }

 
        String verificationToken = UUID.randomUUID().toString();

  
        var user = User.builder()
                .email(request.getEmail())
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .emailVerified(false)
                .verificationToken(verificationToken)
                .familyMemberships(new ArrayList<>()) 
                .build();
        user = userRepository.save(user);

    
        Family family = new Family();
        family.setName(request.getUsername() + "'s Family");
        family.setCreatedBy(user);
        family = familyRepository.save(family);

     
        FamilyMember familyMember = new FamilyMember();
        familyMember.setFamily(family);
        familyMember.setUser(user);
        familyMember.setRole(FamilyMember.Role.ADMIN); 
        familyMember.setStatus(FamilyMember.Status.ACTIVE);
        familyMemberRepository.save(familyMember);

  
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
   
        var existingUser = userRepository.findByGoogleId(googleId);
        
        User user;
        if (existingUser.isPresent()) {
            user = existingUser.get();
        } else {
          
            var userByEmail = userRepository.findByEmail(email);
            if (userByEmail.isPresent()) {
             
                user = userByEmail.get();
                user.setGoogleId(googleId);
                user.setEmailVerified(true); 
                userRepository.save(user); 
            } else {
      
                String randomPassword = UUID.randomUUID().toString();
                user = User.builder()
                        .email(email)
                        .username(name)
                        .password(passwordEncoder.encode(randomPassword))
                        .googleId(googleId)
                        .emailVerified(true) 
                        .avatarUrl(picture)
                        .familyMemberships(new ArrayList<>())
                        .build();
                user = userRepository.save(user);

          
                Family family = new Family();
                family.setName(name + "'s Family");
                family.setCreatedBy(user);
                family = familyRepository.save(family);

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