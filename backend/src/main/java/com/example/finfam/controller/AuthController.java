package com.example.finfam.controller;

import com.example.finfam.dto.response.AuthenticationResponse;
import com.example.finfam.dto.request.LoginRequest;
import com.example.finfam.dto.request.RegisterRequest;
import com.example.finfam.dto.request.GoogleAuthRequest;
import com.example.finfam.service.AuthenticationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;


@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
@Tag(name = "Authentication", description = "Operações de autenticação e registro de usuários")
public class AuthController {
    private final AuthenticationService service;

    @PostMapping("/register")
    @Operation(summary = "Registrar usuário", description = "Cria uma nova conta de usuário e envia email de verificação")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Usuário registrado com sucesso. Email de verificação enviado."),
            @ApiResponse(responseCode = "400", description = "Dados inválidos ou email já existe")
    })
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        service.register(request);
        return ResponseEntity.ok("Usuário registrado com sucesso. Por favor, verifique seu email.");
    }

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Autentica um usuário e retorna token JWT")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Login realizado com sucesso"),
            @ApiResponse(responseCode = "401", description = "Credenciais inválidas ou email não verificado")
    })
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(service.login(request));
    }

    @GetMapping("/verify-email")
    @Operation(summary = "Verificar email", description = "Verifica o email do usuário usando o token de verificação")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Email verificado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Token inválido ou expirado")
    })
    public ResponseEntity<Map<String, String>> verifyEmail(@RequestParam String token) {
        service.verifyEmail(token);
        return ResponseEntity.ok(Map.of("message", "Email verificado com sucesso!"));
    }

    @PostMapping("/auth/google")
    @Operation(summary = "Login com Google", description = "Autentica um usuário usando Google OAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Login realizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos")
    })
    public ResponseEntity<AuthenticationResponse> googleAuth(@RequestBody GoogleAuthRequest request) {
        // Parse the idToken to extract user info
        // For now, we'll expect the frontend to send the decoded token data
        // In production, you should validate the idToken on the backend
        return ResponseEntity.ok(service.googleLogin(
                request.getGoogleId(),
                request.getEmail(),
                request.getName(),
                request.getPicture()
        ));
    }

}
