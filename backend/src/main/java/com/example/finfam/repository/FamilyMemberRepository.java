package com.example.finfam.repository;

import com.example.finfam.model.Family;
import com.example.finfam.model.FamilyMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface FamilyMemberRepository extends JpaRepository<FamilyMember, Integer> {

    boolean existsByUserId(Integer userId);

    @Query("SELECT fm.family.id FROM FamilyMember fm WHERE fm.user.id = :userId ORDER BY fm.id ASC LIMIT 1")
    Integer findFirstFamilyIdByUserId(@Param("userId") Integer userId);

    @Query("SELECT COUNT(fm) FROM FamilyMember fm WHERE fm.user.id = :userId AND fm.family.id = :familyId")
    long countByUserIdAndFamilyId(@Param("userId") Integer userId, @Param("familyId") Integer familyId);
    
    default boolean existsByUserIdAndFamilyId(Integer userId, Integer familyId) {
        return countByUserIdAndFamilyId(userId, familyId) > 0;
    }

    List<FamilyMember> findByUserId(Integer userId);

    @Query("SELECT fm.family FROM FamilyMember fm WHERE fm.user.id = :userId AND fm.status = 'ACTIVE'")
    List<Family> findFamiliesByUserId(Integer userId);

    @Query("""
    SELECT fm
    FROM FamilyMember fm
    JOIN FETCH fm.user
    WHERE fm.family.id = :familyId
      AND fm.status = :status
""")
    List<FamilyMember> findActiveByFamilyIdWithUser(
            @Param("familyId") Integer familyId,
            @Param("status") FamilyMember.Status status
    );

    @Query("""
    SELECT fm
    FROM FamilyMember fm
    JOIN FETCH fm.user
    WHERE fm.family.id = :familyId
      AND fm.status IN :statuses
""")
    List<FamilyMember> findByFamilyIdWithUserAndStatuses(
            @Param("familyId") Integer familyId,
            @Param("statuses") Collection<FamilyMember.Status> statuses
    );

    Optional<FamilyMember> findByUserIdAndFamilyId(Integer userId, Integer familyId);

    @Query("SELECT fm FROM FamilyMember fm WHERE fm.family.id = :familyId AND fm.user.id = :userId AND fm.role = :role")
    Optional<FamilyMember> findByUserIdAndFamilyIdAndRole(@Param("userId") Integer userId, @Param("familyId") Integer familyId, @Param("role") FamilyMember.Role role);

    @Query("SELECT COUNT(fm) FROM FamilyMember fm WHERE fm.family.id = :familyId AND fm.role = 'ADMIN'")
    long countAdminsByFamilyId(@Param("familyId") Integer familyId);
    
    @Query("SELECT COUNT(fm) > 0 FROM FamilyMember fm WHERE fm.id = :memberId AND fm.family.id = :familyId")
    boolean existsByIdAndFamilyId(@Param("memberId") Integer memberId, @Param("familyId") Integer familyId);
}