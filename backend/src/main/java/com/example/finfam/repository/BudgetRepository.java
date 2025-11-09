package com.example.finfam.repository;

import com.example.finfam.model.Budget;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Integer> {

    List<Budget> findByFamilyId(Integer familyId);

    List<Budget> findByFamilyIdAndYearAndMonth(Integer familyId, Integer year, Integer month);

    Optional<Budget> findByFamilyIdAndCategoryIdAndYearAndMonth(Integer familyId, Integer categoryId, Integer year, Integer month);

    Optional<Budget> findByFamilyIdAndUserIdAndYearAndMonth(Integer familyId, Integer userId, Integer year, Integer month);

    @Modifying
    @Query("DELETE FROM Budget b WHERE b.familyId = :familyId AND b.year = :year AND b.month = :month")
    void deleteByFamilyIdAndYearAndMonth(@Param("familyId") Integer familyId, @Param("year") Integer year, @Param("month") Integer month);
}




