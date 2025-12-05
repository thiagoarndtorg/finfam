package com.example.finfam.repository;


import com.example.finfam.model.User;
import org.jetbrains.annotations.NotNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;


public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByEmail(String email);

    Optional<User> findByVerificationToken(String verificationToken);

    Optional<User> findByGoogleId(String googleId);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.familyMemberships fm LEFT JOIN FETCH fm.family WHERE u.id = :userId")
    Optional<User> findByIdWithFamilyMemberships(@Param("userId") Integer userId);


}
