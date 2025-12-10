package com.example.finfam.service;

import com.example.finfam.dto.request.OpenBankAuthRequest;
import com.example.finfam.dto.request.OpenBankFetchRequest;
import com.example.finfam.dto.TransactionDTO;
import com.example.finfam.dto.response.OpenBankAccountResponse;
import com.example.finfam.dto.response.OpenBankStatementResponse;
import com.example.finfam.dto.response.OpenBankTransactionResponse;
import com.example.finfam.exception.CustomException;
import com.example.finfam.model.Account;
import com.example.finfam.model.Bank;
import com.example.finfam.model.FamilyMember;
import com.example.finfam.model.User;
import com.example.finfam.repository.BankRepository;
import com.example.finfam.repository.FamilyMemberRepository;
import com.example.finfam.utils.BankEnum;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import static com.example.finfam.utils.TransactionTypeConverter.resolve;

@Service
@RequiredArgsConstructor
@Slf4j
public class OpenBankService {

    private final OkHttpClient client = new OkHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();
    private final AccountService accountService;
    private final BankRepository bankRepo;
    private final JwtService jwtService;
    private final TransactionService transactionService;

    private final FamilyMemberRepository familyMemberRepository; // Adicione isso se ainda não tiver
    private final UserService userService;


    @Value("${pluggy.client.id}")
    private String clientId;

    @Value("${pluggy.client.secret}")
    private String clientSecret;

    @Value("${pluggy.api.url}")
    private String apiUrl;

    // Get API Key
    public String getApiKey() throws IOException {
        OpenBankAuthRequest authRequest = new OpenBankAuthRequest(clientId, clientSecret);
        RequestBody body = RequestBody.create(
                mapper.writeValueAsString(authRequest),
                MediaType.get("application/json")
        );

        Request request = new Request.Builder()
                .url(apiUrl + "/auth")
                .post(body)
                .header("Content-Type", "application/json")
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) throw new IOException("Auth failed: " + response);
            String json = response.body().string();
            return mapper.readTree(json).get("apiKey").asText();
        }
    }

    // Get Connect Token
    public String getConnectToken(String apiKey) throws IOException {
        Request request = new Request.Builder()
                .url(apiUrl + "/connect_token")
                .post(RequestBody.create("", MediaType.get("application/json")))
                .header("X-API-KEY", apiKey)
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) throw new IOException("Token failed: " + response);
            String json = response.body().string();
            return mapper.readTree(json).get("accessToken").asText();
        }
    }

    // Fetch Accounts
    public List<OpenBankAccountResponse> getAccounts(String itemId, String apiKey) throws IOException {
        String cleanItemId = itemId.replaceAll("\"", "");
        String url = apiUrl + "/accounts?itemId=" + cleanItemId;

        Request request = new Request.Builder()
                .url(url)
                .header("X-API-KEY", apiKey)
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Accounts fetch failed: " + response.code() + " - " + response.body().string());
            }

            JsonNode json = mapper.readTree(response.body().string());
            List<OpenBankAccountResponse> accounts = new ArrayList<>();

            for (JsonNode node : json.get("results")) {
                OpenBankAccountResponse account = OpenBankAccountResponse.builder()
                        .id(node.get("id").asText())
                        .type(node.get("type").asText())
                        .balance(node.get("balance").asDouble())
                        .build();

                if (node.has("bankData") && !node.get("bankData").isNull()
                        && node.get("bankData").has("transferNumber")
                        && !node.get("bankData").get("transferNumber").isNull()) {
                    String transferNumber = node.get("bankData").get("transferNumber").asText();
                    account.setBankName(BankEnum.fromTransferNumber(transferNumber));
                } else {
                    account.setBankName(BankEnum.UNKNOWN);
                }

                accounts.add(account);
            }
            return accounts;
        }
    }

    // Fetch Transactions
    public List<OpenBankTransactionResponse> getTransactions(String accountId, String apiKey, BankEnum bankName) throws IOException {
        List<OpenBankTransactionResponse> allTransactions = new ArrayList<>();
        int page = 1;
        int pageSize = 200;
        boolean hasMore = true;

        while (hasMore) {
            HttpUrl.Builder urlBuilder = HttpUrl.parse(apiUrl + "/transactions").newBuilder()
                    .addQueryParameter("accountId", accountId)
                    .addQueryParameter("pageSize", String.valueOf(pageSize))
                    .addQueryParameter("page", String.valueOf(page));

            Request request = new Request.Builder()
                    .url(urlBuilder.build())
                    .header("X-API-KEY", apiKey)
                    .build();

            try (Response response = client.newCall(request).execute()) {
                if (!response.isSuccessful()) throw new IOException("Transactions fetch failed: " + response);
                JsonNode json = mapper.readTree(response.body().string());
                JsonNode results = json.get("results");
                for (JsonNode node : results) {
                    allTransactions.add(new OpenBankTransactionResponse(
                            node.get("id").asText(),
                            node.get("date").asText(),
                            node.get("description").asText(),
                            node.get("amount").asDouble(),
                            resolve(BigDecimal.valueOf(node.get("amount").asDouble())),
                            bankName
                    ));
                }
                hasMore = results.size() == pageSize;
                page++;
            }
        }
        return allTransactions;
    }

    public OpenBankTransactionResponse getTransaction(
            String accountId,
            String apiKey,
            BankEnum bankName
    ) throws IOException {

        HttpUrl url = HttpUrl.parse(apiUrl + "/transactions").newBuilder()
                .addQueryParameter("accountId", accountId)
                .addQueryParameter("pageSize", "1")  // only 1 result
                .addQueryParameter("page", "1")
                .build();

        Request request = new Request.Builder()
                .url(url)
                .header("X-API-KEY", apiKey)
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Failed to fetch transaction: " + response);
            }

            JsonNode json = mapper.readTree(response.body().string());
            JsonNode results = json.get("results");

            if (results == null || !results.elements().hasNext()) {
                return null; // or throw
            }

            JsonNode node = results.get(0); // FIRST transaction

            return new OpenBankTransactionResponse(
                    node.get("id").asText(),
                    node.get("date").asText(),
                    node.get("description").asText(),
                    node.get("amount").asDouble(),
                    resolve(BigDecimal.valueOf(node.get("amount").asDouble())),
                    bankName
            );
        }
    }




    public OpenBankStatementResponse syncBankStatement(OpenBankFetchRequest request, String token) throws IOException {
        String itemId = request.getItemId();
        Integer familyId = request.getFamilyId();

        String jwtToken = token.substring(7);
        Integer userId = jwtService.extractUserId(jwtToken);
        
        System.out.println("DEBUG OpenBankService - Received familyId from request: " + familyId);
        System.out.println("DEBUG OpenBankService - userId: " + userId + ", itemId: " + itemId);


        if (itemId == null || itemId.trim().isEmpty()) {
            throw new CustomException("Faça login primeiro");
        }
        if (userId == null) {
            throw new CustomException("Usuário não especificado");
        }


        // Determine familyId
        if (familyId == null) {
            // Buscar diretamente pelo repositório
            List<FamilyMember> memberships = familyMemberRepository.findByUserId(userId);
            if (memberships.isEmpty()) {
                throw new CustomException("Usuário não pertence a nenhuma família");
            }
            // Usar o primeiro resultado
            familyId = memberships.get(0).getFamily().getId();
        } else {
            // Verificar se o usuário pertence à família especificada
            boolean belongsToFamily = familyMemberRepository.existsByUserIdAndFamilyId(userId, familyId);
            if (!belongsToFamily) {
                throw new CustomException("Usuário não pertence à família especificada: " + familyId);
            }
        }

        String cleanItemId = itemId.replaceAll("\"", "");


        String apiKey = getApiKey();
        List<OpenBankAccountResponse> pluggyAccounts = getAccounts(cleanItemId, apiKey);
        if (pluggyAccounts.isEmpty()) {
            throw new CustomException("Nenhuma conta encontrada com o ID: " + cleanItemId);
        }

        BankEnum bankEnum = pluggyAccounts.get(0).getBankName();
        String bankCode = bankEnum.getBankCode();


        boolean userHasBankInFamily = accountService.existsByUserIdAndFamilyIdAndBankCode(userId, familyId, bankCode);
        boolean itemIdExistsInFamily = accountService.existsByItemIdAndFamilyId(cleanItemId, familyId);


        if (userHasBankInFamily) {
            throw new CustomException("Você já conectou uma conta deste banco (" + bankEnum + ") nesta família");
        }


        if (itemIdExistsInFamily) {
            throw new CustomException("Esta conta específica já está conectada nesta família");
        }

        Bank bank = bankRepo.findByBankCode(bankCode)
                .orElseThrow(() -> new CustomException("Banco não suportado: " + bankEnum));

        List<OpenBankTransactionResponse> allTransactions = new ArrayList<>();
        double totalBalance = 0.00;
        for (OpenBankAccountResponse pluggyAccount : pluggyAccounts) {
            allTransactions.addAll(getTransactions(pluggyAccount.getId(), apiKey, bankEnum));
        }
        totalBalance = totalBalance + pluggyAccounts.get(0).getBalance();
        

        User user = userService.findById(userId);
        String userName = user.getUsername() != null ? user.getUsername() : user.getEmail();
        

        Account account = accountService.saveAccount(userId, familyId, bank.getId(), cleanItemId, bank.getName() + " Account - " + userName, totalBalance);


        var transactions = TransactionDTO.convertToTransactionDTOs(allTransactions, account.getId(), account.getName(), userId, familyId);
        transactionService.saveTransactions(transactions);

        OpenBankStatementResponse response = new OpenBankStatementResponse(cleanItemId, bankEnum,  account.getBalance(), allTransactions);
        response.getTransactions().sort(Comparator.comparing(OpenBankTransactionResponse::getDate).reversed());

        return response;
    }


    public List<OpenBankStatementResponse> autoSyncUserAccounts(Integer userId, Integer familyId) throws IOException {

        List<Account> userAccounts = accountService.getAccountsByUserAndFamily(userId, familyId);
        
        if (userAccounts.isEmpty()) {
            return new ArrayList<>();
        }

        String apiKey = getApiKey();
        List<OpenBankStatementResponse> syncResults = new ArrayList<>();

        log.info("Starting auto-sync for {} accounts (userId={}, familyId={})", userAccounts.size(), userId, familyId);

        for (Account account : userAccounts) {
            try {

                if (account.getItemId() == null || account.getItemId().trim().isEmpty()) {
                    continue;
                }

                String cleanItemId = account.getItemId().replaceAll("\"", "");
                

                List<OpenBankAccountResponse> pluggyAccounts = getAccounts(cleanItemId, apiKey);
                if (pluggyAccounts.isEmpty()) {
                    continue;
                }

                BankEnum bankEnum = pluggyAccounts.get(0).getBankName();
                

                double totalBalance = 0.00;
                List<OpenBankTransactionResponse> allTransactions = new ArrayList<>();

                for (OpenBankAccountResponse pluggyAccount : pluggyAccounts) {
                    allTransactions.addAll(getTransactions(pluggyAccount.getId(), apiKey, bankEnum));
                }
                totalBalance = totalBalance + pluggyAccounts.get(0).getBalance();


                account.setBalance(new BigDecimal(totalBalance));
                accountService.updateAccount(account);


                var transactions = TransactionDTO.convertToTransactionDTOs(allTransactions, account.getId(), account.getName(), userId, familyId);
                log.info("Fetched {} transactions from Pluggy for accountId={} (bank={})", allTransactions.size(), account.getId(), bankEnum);
                transactionService.saveTransactions(transactions);




                OpenBankStatementResponse response = new OpenBankStatementResponse(cleanItemId, bankEnum, account.getBalance(), allTransactions);
                response.getTransactions().sort(Comparator.comparing(OpenBankTransactionResponse::getDate).reversed());
                syncResults.add(response);

            } catch (Exception e) {

                log.error("Error syncing account {}: {}", account.getId(), e.getMessage());
            }
        }

        log.info("Auto-sync finished for userId={} familyId={}. Synced {} accounts.", userId, familyId, syncResults.size());
        return syncResults;
    }













    public void triggerPluggySync(String itemId, String apiKey) throws IOException {
        HttpUrl url = HttpUrl.parse("https://api.pluggy.ai/items/" + itemId);

        RequestBody body = RequestBody.create(
                "{}", MediaType.parse("application/json")); // empty JSON → just trigger sync

        Request request = new Request.Builder()
                .url(url)
                .patch(body)
                .header("X-API-KEY", apiKey)
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Failed to trigger Pluggy sync: " + response);
            }

            log.info("Pluggy sync triggered successfully for itemId={}", itemId);
        }
    }





    public OpenBankStatementResponse syncSingleAccount(Integer accountId, Integer userId, Integer familyId) throws IOException {

        Account account = accountService.getAccountsByUserAndFamily(userId, familyId).stream()
                .filter(acc -> acc.getId().equals(accountId))
                .findFirst()
                .orElseThrow(() -> new CustomException("Account not found or does not belong to user/family", org.springframework.http.HttpStatus.NOT_FOUND));


        if (!account.getUserId().equals(userId) || !account.getFamilyId().equals(familyId)) {
            throw new CustomException("Account does not belong to user/family", org.springframework.http.HttpStatus.FORBIDDEN);
        }

        String itemId = account.getItemId();
        if (itemId == null || itemId.trim().isEmpty()) {
            throw new CustomException("Account does not have a valid itemId");
        }

        try {

            String apiKey = getApiKey();
            String cleanItemId = itemId.replaceAll("\"", "");


            triggerPluggySync(cleanItemId, apiKey);


             Thread.sleep(5000);


            List<OpenBankAccountResponse> pluggyAccounts = getAccounts(cleanItemId, apiKey);
            if (pluggyAccounts.isEmpty()) {
                throw new CustomException("No accounts found in Pluggy for this itemId. Please reconnect your bank account.");
            }

            BankEnum bankEnum = pluggyAccounts.get(0).getBankName();

            double totalBalance = 0.00;
            List<OpenBankTransactionResponse> allTransactions = new ArrayList<>();


            for (OpenBankAccountResponse pluggyAccount : pluggyAccounts) {
                allTransactions.addAll(getTransactions(pluggyAccount.getId(), apiKey, bankEnum));
            }
            totalBalance += pluggyAccounts.get(0).getBalance();


            account.setBalance(new BigDecimal(totalBalance));
            accountService.updateAccount(account);


            var transactions = TransactionDTO.convertToTransactionDTOs(
                    allTransactions, account.getId(), account.getName(), userId, familyId);

            log.info("Fetched {} transactions from Pluggy for accountId={} (bank={})",
                    allTransactions.size(), account.getId(), bankEnum);

            transactionService.saveTransactions(transactions);


            OpenBankStatementResponse response = new OpenBankStatementResponse(
                    cleanItemId, bankEnum, account.getBalance(), allTransactions);

            response.getTransactions().sort(Comparator.comparing(OpenBankTransactionResponse::getDate).reversed());

            return response;

        } catch (IOException e) {
            log.error("Error syncing account {}: {}", accountId, e.getMessage());
            throw new CustomException("Failed to sync account. Please try again or reconnect your bank.");
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error syncing account {}: {}", accountId, e.getMessage());
            throw new CustomException("Unexpected error while syncing account. Try again.");
        }
    }
}