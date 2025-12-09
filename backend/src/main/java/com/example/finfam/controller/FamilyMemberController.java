package com.example.finfam.controller;

import com.example.finfam.dto.request.AcceptInvitationRequest;
import com.example.finfam.dto.request.InviteFamilyMemberRequest;
import com.example.finfam.dto.request.UpdateMemberRoleRequest;
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

@RestController
@RequestMapping("/api/family")
@RequiredArgsConstructor
@Tag(name = "Family Members", description = "Operações de gerenciamento de membros da família")
@SecurityRequirement(name = "bearerAuth")
public class FamilyMemberController {
    
    private final FamilyMemberService familyMemberService;

    @PostMapping("/{familyId}/members/invite")
    @Operation(summary = "Convidar membro", description = "Convidar um novo membro para a família (apenas ADMIN)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Convite enviado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos ou usuário já é membro"),
            @ApiResponse(responseCode = "401", description = "Token de autorização inválido"),
            @ApiResponse(responseCode = "403", description = "Apenas administradores podem convidar membros"),
            @ApiResponse(responseCode = "404", description = "Usuário não encontrado")
    })
    public ResponseEntity<Void> inviteMember(
            @Parameter(description = "ID da família") @PathVariable Integer familyId,
            @Parameter(description = "Token JWT de autorização") @RequestHeader("Authorization") String token,
            @RequestBody InviteFamilyMemberRequest request) {
        familyMemberService.inviteMember(familyId, token, request);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{familyId}/members/{memberId}/role")
    @Operation(summary = "Atualizar role de membro", description = "Atualizar a role de um membro (apenas ADMIN)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Role atualizada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "401", description = "Token de autorização inválido"),
            @ApiResponse(responseCode = "403", description = "Apenas administradores podem atualizar roles"),
            @ApiResponse(responseCode = "404", description = "Membro não encontrado")
    })
    public ResponseEntity<Void> updateMemberRole(
            @Parameter(description = "ID da família") @PathVariable Integer familyId,
            @Parameter(description = "ID do membro") @PathVariable Integer memberId,
            @Parameter(description = "Token JWT de autorização") @RequestHeader("Authorization") String token,
            @RequestBody UpdateMemberRoleRequest request) {
        familyMemberService.updateMemberRole(familyId, memberId, token, request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{familyId}/members/{memberId}")
    @Operation(summary = "Remover membro", description = "Remover um membro da família (apenas ADMIN)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Membro removido com sucesso"),
            @ApiResponse(responseCode = "400", description = "Não é possível remover o único administrador"),
            @ApiResponse(responseCode = "401", description = "Token de autorização inválido"),
            @ApiResponse(responseCode = "403", description = "Apenas administradores podem remover membros"),
            @ApiResponse(responseCode = "404", description = "Membro não encontrado")
    })
    public ResponseEntity<Void> removeMember(
            @Parameter(description = "ID da família") @PathVariable Integer familyId,
            @Parameter(description = "ID do membro") @PathVariable Integer memberId,
            @Parameter(description = "Token JWT de autorização") @RequestHeader("Authorization") String token) {
        familyMemberService.removeMember(familyId, memberId, token);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{familyId}/members/{memberId}/resend-invite")
    @Operation(summary = "Reenviar convite", description = "Reenviar convite para um membro pendente (apenas ADMIN)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Convite reenviado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Apenas convites pendentes podem ser reenviados"),
            @ApiResponse(responseCode = "401", description = "Token de autorização inválido"),
            @ApiResponse(responseCode = "403", description = "Apenas administradores podem reenviar convites"),
            @ApiResponse(responseCode = "404", description = "Membro não encontrado")
    })
    public ResponseEntity<Void> resendInvite(
            @Parameter(description = "ID da família") @PathVariable Integer familyId,
            @Parameter(description = "ID do membro") @PathVariable Integer memberId,
            @Parameter(description = "Token JWT de autorização") @RequestHeader("Authorization") String token) {
        familyMemberService.resendInvite(familyId, memberId, token);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/accept-invitation")
    @Operation(summary = "Accept family invitation", description = "Accept a family invitation using the token from the email")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Invitation accepted successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid or expired token"),
            @ApiResponse(responseCode = "404", description = "Member not found")
    })
    public ResponseEntity<Void> acceptInvitation(@RequestBody AcceptInvitationRequest request) {
        familyMemberService.acceptInvitation(request.getToken());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{familyId}/leave")
    @Operation(summary = "Sair da família", description = "Permite que um membro saia da família. O criador da família não pode sair.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Membro saiu da família com sucesso"),
            @ApiResponse(responseCode = "400", description = "O criador da família não pode sair ou é o único administrador"),
            @ApiResponse(responseCode = "401", description = "Token de autorização inválido"),
            @ApiResponse(responseCode = "404", description = "Família ou membro não encontrado")
    })
    public ResponseEntity<Void> leaveFamily(
            @Parameter(description = "ID da família") @PathVariable Integer familyId,
            @Parameter(description = "Token JWT de autorização") @RequestHeader("Authorization") String token) {
        familyMemberService.leaveFamily(familyId, token);
        return ResponseEntity.ok().build();
    }
}



