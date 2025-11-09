package com.example.finfam.controller;

import com.example.finfam.dto.response.OpenBankStatementResponse;
import com.example.finfam.exception.CustomException;
import com.example.finfam.service.JwtService;
import com.example.finfam.service.OpenBankService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
@Tag(name = "Account", description = "Account management and synchronization endpoints")
public class AccountController {

    private final OpenBankService openBankService;
    private final JwtService jwtService;

    @PostMapping("/accounts/{accountId}/sync")
    @Operation(summary = "Sync single account", description = "Synchronizes a specific account by fetching fresh data from Pluggy API using stored itemId")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Account synchronized successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid data or account not found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - account does not belong to user/family"),
            @ApiResponse(responseCode = "404", description = "Account not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error - sync failed")
    })
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<OpenBankStatementResponse> syncAccount(
            @Parameter(description = "Account ID to sync") @PathVariable Integer accountId,
            @Parameter(description = "Family ID") @RequestBody SyncAccountRequest request,
            @Parameter(description = "Token JWT de autorização") @RequestHeader(name = "Authorization") String token) {
        try {
            // Extract userId from JWT
            String jwtToken = token.substring(7);
            Integer userId = jwtService.extractUserId(jwtToken);

            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // Call service to sync account
            OpenBankStatementResponse response = openBankService.syncSingleAccount(accountId, userId, request.getFamilyId());
            return ResponseEntity.ok(response);

        } catch (CustomException e) {
            if (e.getMessage().contains("not found") || e.getMessage().contains("does not belong")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Request DTO for sync endpoint
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class SyncAccountRequest {
        private Integer familyId;
    }
}
