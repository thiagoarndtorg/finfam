package com.example.finfam.service;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.springframework.stereotype.Service;
import java.util.Date;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;


@Service
public class JwtService {

    private final String secret = System.getenv("SECRET_KEY");

    public String generateToken(Integer userId, String email) {
        return JWT.create()
                .withClaim("id", userId)
                .withClaim("email", email)
                .withClaim("type", "authentication")
                .withIssuedAt(new Date())
                .withExpiresAt(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 10))
                .sign(Algorithm.HMAC256(secret));
    }


    public String generateInvitationToken(String email, Integer projectId) {
        return JWT.create()
                .withClaim("email",email)
                .withClaim("projectId", projectId)
                .withClaim("type", "invitation")
                .withIssuedAt(new Date())
                .withExpiresAt(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 24 * 7))
                .sign(Algorithm.HMAC256(secret));
    }

    public String generateFamilyInvitationToken(String email, Integer familyId) {
        return JWT.create()
                .withClaim("email", email)
                .withClaim("familyId", familyId)
                .withClaim("type", "family_invitation")
                .withIssuedAt(new Date())
                .withExpiresAt(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 24 * 7))
                .sign(Algorithm.HMAC256(secret));
    }

    public boolean validateToken(String token) {
        try {
            JWT.require(Algorithm.HMAC256(secret)).build().verify(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String extractUsername(String token) {
        try {
            DecodedJWT decodedJWT = JWT.decode(token);
            return decodedJWT.getClaim("email").asString();
        } catch (Exception e) {
            return null;
        }
    }

    public Integer extractUserId(String token) {
        try {
            DecodedJWT decodedJWT = JWT.decode(token);
            return decodedJWT.getClaim("id").asInt();
        } catch (Exception e) {
            return null;
        }
    }


    public boolean isInvitationToken(String token) {
        try {
            DecodedJWT decodedJWT = JWT.decode(token);
            String tokenType = decodedJWT.getClaim("type").asString();
            return "invitation".equals(tokenType);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
        try {
            DecodedJWT decodedJWT = JWT.decode(token);
            Date expirationDate = decodedJWT.getExpiresAt();
            return expirationDate.before(new Date());
        } catch (Exception e) {
            return true;
        }
    }
}