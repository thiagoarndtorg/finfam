package com.example.finfam.controller;

import com.example.finfam.dto.request.OpenBankFetchRequest;
import com.example.finfam.dto.response.OpenBankStatementResponse;
import com.example.finfam.service.OpenBankService;
import com.example.finfam.service.JwtService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
@Tag(name = "Open Banking", description = "Integração com APIs bancárias para sincronização de dados")
public class OpenBankController {

    private final OpenBankService openBankService;
    private final JwtService jwtService;

    @GetMapping("/connect-token")
    @Operation(summary = "Obter token de conexão", description = "Gera um token para conectar com APIs bancárias")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Token gerado com sucesso"),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<String> getConnectToken() throws IOException {
        String apiKey = openBankService.getApiKey();
        String connectToken = openBankService.getConnectToken(apiKey);
        return ResponseEntity.ok(connectToken);
    }

    @PostMapping("/bank-statement")
    @Operation(summary = "Sincronizar extrato bancário", description = "Busca e sincroniza transações de uma conta bancária")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Extrato sincronizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "401", description = "Token de autorização inválido"),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<OpenBankStatementResponse> fetchBankStatement(
            @RequestBody OpenBankFetchRequest request,  
            @Parameter(description = "Token JWT de autorização") @RequestHeader (name="Authorization") String token) throws IOException {
        OpenBankStatementResponse response = openBankService.syncBankStatement(request, token);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/auto-sync-accounts")
    @Operation(summary = "Sincronização automática de contas", description = "Sincroniza automaticamente todas as contas conectadas do usuário")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Contas sincronizadas com sucesso"),
            @ApiResponse(responseCode = "401", description = "Token de autorização inválido"),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<List<OpenBankStatementResponse>> autoSyncAccounts(
            @RequestBody OpenBankFetchRequest request,
            @Parameter(description = "Token JWT de autorização") @RequestHeader(name = "Authorization") String token) throws IOException {
        String jwtToken = token.substring(7);
        Integer userId = jwtService.extractUserId(jwtToken);
        List<OpenBankStatementResponse> responses = openBankService.autoSyncUserAccounts(userId, request.getFamilyId());
        return ResponseEntity.ok(responses);
    }
}