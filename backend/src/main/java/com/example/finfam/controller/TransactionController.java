package com.example.finfam.controller;

import com.example.finfam.dto.request.TransactionCreateRequest;
import com.example.finfam.dto.request.TransactionUpdateRequest;
import com.example.finfam.model.Transaction;
import com.example.finfam.service.JwtService;
import com.example.finfam.service.TransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/transactions")
@Tag(name = "Transactions", description = "Operações de CRUD para transações financeiras")
public class TransactionController {
    private final TransactionService transactionService;
    private final JwtService jwtService;

    @PostMapping
    @Operation(summary = "Criar transação", description = "Cria uma nova transação financeira")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Transação criada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos ou conta não encontrada")
    })
    public ResponseEntity<Transaction> create(@RequestBody TransactionCreateRequest request) {
        return ResponseEntity.ok(transactionService.create(request));
    }

    @PostMapping("/batch")
    @Operation(summary = "Criar transações em lote", description = "Cria múltiplas transações de uma vez")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Transações criadas com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos")
    })
    public ResponseEntity<List<Transaction>> createBatch(@RequestBody List<TransactionCreateRequest> requests) {
        return ResponseEntity.ok(transactionService.createBatch(requests));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar transação", description = "Atualiza uma transação existente")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Transação atualizada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos ou transação não pertence à família"),
            @ApiResponse(responseCode = "404", description = "Transação não encontrada")
    })
    public ResponseEntity<Transaction> update(
            @Parameter(description = "ID da transação") @PathVariable Integer id,
            @Parameter(description = "ID da família") @RequestParam Integer familyId,
            @RequestBody TransactionUpdateRequest request) {
        return ResponseEntity.ok(transactionService.update(id, familyId, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deletar transação", description = "Remove uma transação")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Transação deletada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Transação não pertence à família"),
            @ApiResponse(responseCode = "404", description = "Transação não encontrada")
    })
    public ResponseEntity<Void> delete(
            @Parameter(description = "ID da transação") @PathVariable Integer id, 
            @Parameter(description = "ID da família") @RequestParam Integer familyId) {
        transactionService.delete(id, familyId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/account/{accountId}")
    @Operation(summary = "Transações por conta", description = "Lista todas as transações de uma conta específica")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de transações retornada com sucesso")
    })
    public ResponseEntity<List<Transaction>> byAccount(
            @Parameter(description = "ID da conta") @PathVariable int accountId) {
        return ResponseEntity.ok(transactionService.getTransactionsByAccount(accountId));
    }

    @GetMapping
    @Operation(summary = "Transações por usuário e família", description = "Lista transações de um usuário específico em uma família")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de transações retornada com sucesso")
    })
    public ResponseEntity<List<Transaction>> byUserFamily(
            @Parameter(description = "ID do usuário") @RequestParam int userId,
            @Parameter(description = "ID da família") @RequestParam int familyId) {
        return ResponseEntity.ok(transactionService.getTransactionsByUserAndFamily(userId, familyId));
    }

    @GetMapping("/family/{familyId}")
    @Operation(summary = "Transações por família", description = "Lista todas as transações de uma família")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de transações retornada com sucesso")
    })
    public ResponseEntity<List<Transaction>> byFamily(
            @Parameter(description = "ID da família") @PathVariable int familyId) {
        return ResponseEntity.ok(transactionService.getTransactionsByFamily(familyId));
    }

    @GetMapping("/range")
    @Operation(summary = "Transações por período", description = "Lista transações dentro de um período específico")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de transações retornada com sucesso")
    })
    public ResponseEntity<List<Transaction>> byDateRange(
            @Parameter(description = "Data inicial (YYYY-MM-DD)") @RequestParam LocalDate start, 
            @Parameter(description = "Data final (YYYY-MM-DD)") @RequestParam LocalDate end) {
        return ResponseEntity.ok(transactionService.getTransactionsByDateRange(start, end));
    }

    @PostMapping("/auto-categorize")
    @Operation(summary = "Categorizar automaticamente transações", description = "Usa ML para categorizar transações sem categoria")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Transações categorizadas com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos")
    })
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<List<Transaction>> autoCategorize(
            @Parameter(description = "Token JWT de autorização") @RequestHeader(name = "Authorization") String token,
            @Parameter(description = "ID da família") @RequestParam Integer familyId) {
        String jwtToken = token.substring(7);
        Integer userId = jwtService.extractUserId(jwtToken);
        List<Transaction> transactions = transactionService.autoCategorizeTransactions(userId, familyId);
        return ResponseEntity.ok(transactions);
    }

    @PostMapping("/confirm-category")
    @Operation(summary = "Confirmar categoria sugerida", description = "Confirma a categoria sugerida pelo ML")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Categoria confirmada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos")
    })
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Transaction> confirmCategory(
            @Parameter(description = "Token JWT de autorização") @RequestHeader(name = "Authorization") String token,
            @RequestBody ConfirmCategoryRequest request) {
        String jwtToken = token.substring(7);
        Integer userId = jwtService.extractUserId(jwtToken);
        Transaction transaction = transactionService.confirmCategory(
            request.getTransactionId(), 
            request.getFamilyId(), 
            userId
        );
        return ResponseEntity.ok(transaction);
    }

    @PostMapping("/reject-category")
    @Operation(summary = "Rejeitar categoria sugerida", description = "Rejeita a categoria sugerida pelo ML")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Categoria rejeitada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos")
    })
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Void> rejectCategory(
            @Parameter(description = "Token JWT de autorização") @RequestHeader(name = "Authorization") String token,
            @RequestBody RejectCategoryRequest request) {
        String jwtToken = token.substring(7);
        Integer userId = jwtService.extractUserId(jwtToken);
        transactionService.rejectCategory(
            request.getTransactionId(), 
            request.getFamilyId(), 
            userId
        );
        return ResponseEntity.ok().build();
    }

    @PostMapping("/correct-category")
    @Operation(summary = "Corrigir categoria", description = "Corrige a categoria manualmente e reforça o modelo ML")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Categoria corrigida com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos")
    })
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Transaction> correctCategory(
            @Parameter(description = "Token JWT de autorização") @RequestHeader(name = "Authorization") String token,
            @RequestBody CorrectCategoryRequest request) {
        String jwtToken = token.substring(7);
        Integer userId = jwtService.extractUserId(jwtToken);
        Transaction transaction = transactionService.correctCategory(
            request.getTransactionId(), 
            request.getFamilyId(), 
            userId,
            request.getNewCategory()
        );
        return ResponseEntity.ok(transaction);
    }

    @Data
    static class ConfirmCategoryRequest {
        private Integer transactionId;
        private Integer familyId;
    }

    @Data
    static class RejectCategoryRequest {
        private Integer transactionId;
        private Integer familyId;
    }

    @Data
    static class CorrectCategoryRequest {
        private Integer transactionId;
        private Integer familyId;
        private String newCategory;
    }
}


