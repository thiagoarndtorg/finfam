package com.example.finfam.repository;

import com.example.finfam.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Integer> {
    List<Category> findByFamilyId(Integer familyId);

    boolean existsByFamilyIdAndName(Integer familyId, String name);

    Optional<Category> findByIdAndFamilyId(Integer id, Integer familyId);

    @Query("select c from Category c where c.familyId = :familyId and (:isIncome is null or c.isIncome = :isIncome)")
    List<Category> findByFamilyIdAndOptionalIsIncome(@Param("familyId") Integer familyId, @Param("isIncome") Boolean isIncome);
}



