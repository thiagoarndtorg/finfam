package com.example.finfam.controller;

import com.example.finfam.dto.request.BudgetBulkRequest;
import com.example.finfam.dto.request.BudgetRequest;
import com.example.finfam.dto.response.BudgetResponse;
import com.example.finfam.service.BudgetService;
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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/budgets")
@Tag(name = "Budgets", description = "Operações de CRUD para orçamentos familiares")
public class BudgetController {

    private final BudgetService budgetService;

    @PostMapping
    @Operation(summary = "Criar orçamento", description = "Cria ou atualiza um orçamento para categoria ou membro")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Orçamento salvo com sucesso"),
        @ApiResponse(responseCode = "400", description = "Dados inválidos")
    })
    public ResponseEntity<BudgetResponse> create(@RequestBody BudgetRequest request) {
        return ResponseEntity.ok(budgetService.create(request));
    }

    @PostMapping("/bulk")
    @Operation(summary = "Salvar múltiplos orçamentos", description = "Cria ou atualiza múltiplos orçamentos de uma vez (upsert em lote)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Orçamentos salvos com sucesso"),
        @ApiResponse(responseCode = "400", description = "Dados inválidos")
    })
    public ResponseEntity<List<BudgetResponse>> bulk(@RequestBody BudgetBulkRequest request) {
        return ResponseEntity.ok(budgetService.bulkUpsert(request));
    }

    @GetMapping
    @Operation(summary = "Listar orçamentos", description = "Lista todos os orçamentos de uma família para um período específico")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de orçamentos retornada com sucesso")
    })
    public ResponseEntity<List<BudgetResponse>> list(
        @Parameter(description = "ID da família") @RequestParam Integer familyId,
        @Parameter(description = "Ano") @RequestParam Integer year,
        @Parameter(description = "Mês (1-12)") @RequestParam Integer month
    ) {
        return ResponseEntity.ok(budgetService.list(familyId, year, month));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deletar orçamento", description = "Remove um orçamento específico")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Orçamento deletado com sucesso"),
        @ApiResponse(responseCode = "400", description = "Orçamento não pertence à família"),
        @ApiResponse(responseCode = "404", description = "Orçamento não encontrado")
    })
    public ResponseEntity<Void> delete(
        @Parameter(description = "ID do orçamento") @PathVariable Integer id,
        @Parameter(description = "ID da família") @RequestParam Integer familyId
    ) {
        budgetService.delete(id, familyId);
        return ResponseEntity.noContent().build();
    }
}




