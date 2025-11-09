package com.example.finfam.controller;

import com.example.finfam.dto.response.NotificationResponse;
import com.example.finfam.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notifications")
@Tag(name = "Notifications", description = "Operações para gerenciar notificações de orçamento")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "Listar notificações", description = "Lista todas as notificações de uma família")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de notificações retornada com sucesso")
    })
    public ResponseEntity<List<NotificationResponse>> list(
        @Parameter(description = "ID da família") @RequestParam Integer familyId
    ) {
        return ResponseEntity.ok(notificationService.getByFamilyId(familyId));
    }

    @GetMapping("/filter")
    @Operation(summary = "Filtrar notificações por tipo", description = "Lista notificações de uma família filtradas por tipo")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de notificações filtradas retornada com sucesso")
    })
    public ResponseEntity<List<NotificationResponse>> filter(
        @Parameter(description = "ID da família") @RequestParam Integer familyId,
        @Parameter(description = "Tipo de notificação") @RequestParam String type
    ) {
        return ResponseEntity.ok(notificationService.getByFamilyIdAndType(familyId, type));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deletar notificação", description = "Remove uma notificação específica")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Notificação deletada com sucesso"),
        @ApiResponse(responseCode = "400", description = "Notificação não pertence à família"),
        @ApiResponse(responseCode = "404", description = "Notificação não encontrada")
    })
    public ResponseEntity<Void> delete(
        @Parameter(description = "ID da notificação") @PathVariable Integer id,
        @Parameter(description = "ID da família") @RequestParam Integer familyId
    ) {
        notificationService.delete(id, familyId);
        return ResponseEntity.noContent().build();
    }
}

