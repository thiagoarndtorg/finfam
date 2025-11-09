package com.example.finfam.controller;

import com.example.finfam.dto.FamilyDTO;
import com.example.finfam.dto.response.FamilyFinancialResponse;
import com.example.finfam.dto.response.FamilyMemberResponse;
import com.example.finfam.service.FamilyFinancialService;
import com.example.finfam.service.FamilyMemberService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Family Financial", description = "Operações financeiras relacionadas às famílias")
public class FamilyFinancialController {
    private final FamilyFinancialService familyFinancialService;
    private final FamilyMemberService familyMemberService;

    @GetMapping("/family/{familyId}/financials")
    @Operation(summary = "Resumo financeiro da família", description = "Retorna um resumo financeiro completo de uma família")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Resumo financeiro retornado com sucesso"),
            @ApiResponse(responseCode = "401", description = "Token de autorização inválido"),
            @ApiResponse(responseCode = "403", description = "Usuário não tem acesso a esta família"),
            @ApiResponse(responseCode = "404", description = "Família não encontrada")
    })
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<FamilyFinancialResponse> getFamilyFinancials(
            @Parameter(description = "ID da família") @PathVariable Integer familyId,
            @Parameter(description = "Token JWT de autorização") @RequestHeader("Authorization") String token) {
        FamilyFinancialResponse summary = familyFinancialService.getFamilyFinancials(familyId, token);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/user/families")
    @Operation(summary = "Famílias do usuário", description = "Lista todas as famílias que o usuário faz parte")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de famílias retornada com sucesso"),
            @ApiResponse(responseCode = "401", description = "Token de autorização inválido")
    })
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<List<FamilyDTO>> getUserFamilies(
            @Parameter(description = "Token JWT de autorização") @RequestHeader("Authorization") String token) {
        List<FamilyDTO> families = familyFinancialService.getUserFamilies(token);
        return ResponseEntity.ok(families);
    }

    @GetMapping("/family/{familyId}/members")
    @Operation(summary = "Membros da família", description = "Lista todos os membros ativos e pendentes de uma família")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de membros retornada com sucesso"),
        @ApiResponse(responseCode = "401", description = "Token de autorização inválido"),
        @ApiResponse(responseCode = "403", description = "Usuário não tem acesso a esta família")
    })
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<List<FamilyMemberResponse>> getFamilyMembers(
            @Parameter(description = "ID da família") @PathVariable Integer familyId,
            @Parameter(description = "Token JWT de autorização") @RequestHeader("Authorization") String token) {
        List<FamilyMemberResponse> members = familyMemberService.listFamilyMembers(familyId, token);
        return ResponseEntity.ok(members);
    }
}