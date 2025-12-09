package com.example.finfam.service;

import com.example.finfam.dto.request.MLClassifyRequest;
import com.example.finfam.dto.request.MLReinforceRequest;
import com.example.finfam.dto.request.MLTrainRequest;
import com.example.finfam.dto.response.MLClassificationResult;
import com.example.finfam.exception.CustomException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MLService {

    @Value("${ml.service.url:http://localhost:5000}")
    private String mlServiceUrl;

    private final WebClient.Builder webClientBuilder;

    private WebClient getWebClient() {
        log.info("Using ML service URL: {}", mlServiceUrl);
        return webClientBuilder
                .baseUrl(mlServiceUrl)
                .build();
    }

    /**
     * Treina o modelo de um usuário
     */
    public void trainUserModel(Integer userId, String transactionName, String category) {
        try {
            MLTrainRequest request = new MLTrainRequest();
            request.setUserId(userId);
            request.setTransactionName(transactionName);
            request.setCategory(category);

            getWebClient()
                    .post()
                    .uri("/train")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();

            log.info("Model trained successfully for userId: {}, category: {}", userId, category);
        } catch (Exception e) {
            log.error("Error training model for userId: {}", userId, e);
            throw new CustomException("Erro ao treinar modelo: " + e.getMessage());
        }
    }

    /**
     * Classifica transações usando ML
     */
    public List<MLClassificationResult> classifyTransactions(Integer userId, List<MLClassifyRequest.TransactionItem> transactions) {
        try {
            log.info("Classifying {} transactions for userId: {} using ML service at {}", 
                    transactions.size(), userId, mlServiceUrl);
            
            MLClassifyRequest request = new MLClassifyRequest();
            request.setUserId(userId);
            request.setTransactions(transactions);

            MLClassificationResult[] resultsArray = getWebClient()
                    .post()
                    .uri("/classify")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(MLClassificationResult[].class)
                    .timeout(Duration.ofSeconds(30))
                    .block();

            List<MLClassificationResult> results = resultsArray != null 
                ? Arrays.asList(resultsArray) 
                : List.of();

            log.info("Successfully classified {} transactions for userId: {}, got {} results", 
                    transactions.size(), userId, results.size());
            return results;
        } catch (Exception e) {
            log.error("Error classifying transactions for userId: {} at URL: {}", userId, mlServiceUrl, e);
            String errorMsg = e.getMessage();
            if (errorMsg != null && errorMsg.contains("Connection refused")) {
                throw new CustomException("Serviço ML não está rodando. Verifique se o serviço está ativo em " + mlServiceUrl);
            } else if (errorMsg != null && errorMsg.contains("timeout")) {
                throw new CustomException("Timeout ao conectar com o serviço ML. O serviço pode estar sobrecarregado.");
            } else {
                throw new CustomException("Erro ao classificar transações: " + (errorMsg != null ? errorMsg : e.getClass().getSimpleName()));
            }
        }
    }

    /**
     * Reforça o modelo com correção do usuário
     */
    public void reinforceModel(Integer userId, String transactionName, String correctCategory) {
        try {
            MLReinforceRequest request = new MLReinforceRequest();
            request.setUserId(userId);
            request.setTransactionName(transactionName);
            request.setCorrectCategory(correctCategory);

            getWebClient()
                    .post()
                    .uri("/reinforce")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();

            log.info("Model reinforced successfully for userId: {}, category: {}", userId, correctCategory);
        } catch (Exception e) {
            log.error("Error reinforcing model for userId: {}", userId, e);
            throw new CustomException("Erro ao reforçar modelo: " + e.getMessage());
        }
    }
}

