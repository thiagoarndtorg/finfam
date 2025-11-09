package com.example.finfam.controller;

import com.example.finfam.dto.request.CategoryRequest;
import com.example.finfam.dto.response.CategoryResponse;
import com.example.finfam.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/categories")
@Tag(name = "Categories", description = "Operações de CRUD para categorias")
public class CategoryController {
    private final CategoryService categoryService;

    @PostMapping
    @Operation(summary = "Criar categoria", description = "Cria uma nova categoria para uma família")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Categoria criada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos ou nome já existe")
    })
    public ResponseEntity<CategoryResponse> create(@RequestBody CategoryRequest request) {
        return ResponseEntity.ok(categoryService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar categoria", description = "Atualiza uma categoria existente")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Categoria atualizada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos ou categoria não encontrada"),
            @ApiResponse(responseCode = "404", description = "Categoria não encontrada")
    })
    public ResponseEntity<CategoryResponse> update(
            @Parameter(description = "ID da categoria") @PathVariable Integer id,
            @Parameter(description = "ID da família") @RequestParam Integer familyId,
            @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(categoryService.update(id, familyId, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deletar categoria", description = "Remove uma categoria (não pode ser categoria do sistema)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Categoria deletada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Não é possível deletar categoria do sistema"),
            @ApiResponse(responseCode = "404", description = "Categoria não encontrada")
    })
    public ResponseEntity<Void> delete(
            @Parameter(description = "ID da categoria") @PathVariable Integer id, 
            @Parameter(description = "ID da família") @RequestParam Integer familyId) {
        categoryService.delete(id, familyId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar categoria", description = "Retorna uma categoria específica")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Categoria encontrada"),
            @ApiResponse(responseCode = "404", description = "Categoria não encontrada")
    })
    public ResponseEntity<CategoryResponse> get(
            @Parameter(description = "ID da categoria") @PathVariable Integer id, 
            @Parameter(description = "ID da família") @RequestParam Integer familyId) {
        return ResponseEntity.ok(categoryService.get(id, familyId));
    }

    @GetMapping
    @Operation(summary = "Listar categorias", description = "Lista todas as categorias de uma família, opcionalmente filtradas por tipo")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de categorias retornada com sucesso")
    })
    public ResponseEntity<List<CategoryResponse>> list(
            @Parameter(description = "ID da família") @RequestParam Integer familyId,
            @Parameter(description = "Filtrar por tipo: true=receita, false=despesa") @RequestParam(required = false) Boolean isIncome) {
        return ResponseEntity.ok(categoryService.list(familyId, isIncome));
    }
}


