# Endpoints para o Backend Java/Spring Boot

## 1. Endpoint para Listar Contas da Família

### Endpoint: `GET /api/family/{familyId}/accounts`

Este endpoint deve retornar todas as contas ativas de uma família específica.

#### Controller (Java/Spring Boot):
```java
@GetMapping("/family/{familyId}/accounts")
public ResponseEntity<AccountsResponse> getFamilyAccounts(
    @PathVariable Integer familyId,
    @RequestHeader(name = "Authorization") String token
) {
    try {
        String jwtToken = token.substring(7);
        Integer userId = jwtService.extractUserId(jwtToken);
        
        // Verificar se o usuário pertence à família
        boolean belongsToFamily = familyMemberRepository.existsByUserIdAndFamilyId(userId, familyId);
        if (!belongsToFamily) {
            return ResponseEntity.status(403).body(null);
        }
        
        // Buscar contas da família
        List<Account> accounts = accountRepository.findByFamilyIdAndIsActiveTrue(familyId);
        
        AccountsResponse response = new AccountsResponse();
        response.setAccounts(accounts);
        
        return ResponseEntity.ok(response);
    } catch (Exception e) {
        return ResponseEntity.status(500).body(null);
    }
}
```

#### Repository Method:
```java
@Repository
public interface AccountRepository extends JpaRepository<Account, Integer> {
    List<Account> findByFamilyIdAndIsActiveTrue(Integer familyId);
}
```

#### Response DTO:
```java
public class AccountsResponse {
    private List<Account> accounts;
    
    // getters e setters
}
```

## 2. Endpoint para Listar Bancos

### Endpoint: `GET /api/banks`

Este endpoint deve retornar todos os bancos cadastrados.

#### Controller:
```java
@GetMapping("/banks")
public ResponseEntity<BanksResponse> getBanks() {
    try {
        List<Bank> banks = bankRepository.findAll();
        
        BanksResponse response = new BanksResponse();
        response.setBanks(banks);
        
        return ResponseEntity.ok(response);
    } catch (Exception e) {
        return ResponseEntity.status(500).body(null);
    }
}
```

#### Response DTO:
```java
public class BanksResponse {
    private List<Bank> banks;
    
    // getters e setters
}
```

## 3. Endpoint Existente (que você já tem)

### Endpoint: `POST /api/bank-statement`

Este endpoint já existe e é usado para sincronizar dados do Pluggy.

## Estrutura de Dados Esperada

### Account Entity:
```java
@Entity
@Table(name = "accounts")
public class Account {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "user_id")
    private Integer userId;
    
    @Column(name = "family_id")
    private Integer familyId;
    
    @Column(name = "bank_id")
    private Integer bankId;
    
    @Column(name = "item_id")
    private String itemId;
    
    private String name;
    private Double balance;
    private String currency;
    private String color;
    
    @Column(name = "is_active")
    private Boolean isActive;
    
    // getters e setters
}
```

### Bank Entity:
```java
@Entity
@Table(name = "banks")
public class Bank {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    private String name;
    private String bankCode;
    
    // getters e setters
}
```

## Dados de Exemplo para Inserir

```sql
-- Inserir bancos
INSERT INTO banks (name, bank_code) VALUES 
('Nubank', 'NU'),
('Banco Inter', 'BI'),
('Itaú', 'ITAU');

-- Inserir contas (assumindo que já existe família com ID 1 e usuário com ID 1)
INSERT INTO accounts (user_id, family_id, bank_id, item_id, name, balance, currency, color, is_active) VALUES 
(1, 1, 1, 'pluggy_item_123', 'Nubank Checking', 7500.00, 'BRL', '#8a05be', true),
(1, 1, 2, 'pluggy_item_456', 'Banco Inter Savings', 56000.00, 'BRL', '#ff7a00', true),
(1, 1, 3, 'pluggy_item_789', 'Itaú Investment', 87900.00, 'BRL', '#ec7000', true);
```
