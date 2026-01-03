package com.mbda.mbdhackuity.repository;

import com.mbda.mbdhackuity.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    // Recherche par type d'action
    Page<AuditLog> findByActionType(String actionType, Pageable pageable);

    // Recherche par utilisateur
    Page<AuditLog> findByUserId(String userId, Pageable pageable);

    // Recherche par cible
    Page<AuditLog> findByActionTarget(String actionTarget, Pageable pageable);

    // Recherche par période
    Page<AuditLog> findByActionTimestampBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);

    // Recherche combinée
    @Query("SELECT a FROM AuditLog a WHERE " +
           "(COALESCE(:userId, '') = '' OR a.userId = :userId) AND " +
           "(COALESCE(:actionType, '') = '' OR a.actionType = :actionType) AND " +
           "(COALESCE(:actionTarget, '') = '' OR a.actionTarget = :actionTarget) AND " +
           "(CAST(:startDate AS timestamp) IS NULL OR a.actionTimestamp >= :startDate) AND " +
           "(CAST(:endDate AS timestamp) IS NULL OR a.actionTimestamp <= :endDate) " +
           "ORDER BY a.actionTimestamp DESC")
    Page<AuditLog> searchLogs(
        @Param("userId") String userId,
        @Param("actionType") String actionType,
        @Param("actionTarget") String actionTarget,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        Pageable pageable
    );

    // Export pour CSV
    @Query("SELECT a FROM AuditLog a WHERE " +
           "(COALESCE(:userId, '') = '' OR a.userId = :userId) AND " +
           "(COALESCE(:actionType, '') = '' OR a.actionType = :actionType) AND " +
           "(COALESCE(:actionTarget, '') = '' OR a.actionTarget = :actionTarget) AND " +
           "(CAST(:startDate AS timestamp) IS NULL OR a.actionTimestamp >= :startDate) AND " +
           "(CAST(:endDate AS timestamp) IS NULL OR a.actionTimestamp <= :endDate) " +
           "ORDER BY a.actionTimestamp DESC")
    List<AuditLog> findAllForExport(
        @Param("userId") String userId,
        @Param("actionType") String actionType,
        @Param("actionTarget") String actionTarget,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    // Statistiques
    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.actionType = :actionType AND a.actionTimestamp >= :since")
    long countByActionTypeSince(@Param("actionType") String actionType, @Param("since") LocalDateTime since);

    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.userId = :userId AND a.actionTimestamp >= :since")
    long countByUserIdSince(@Param("userId") String userId, @Param("since") LocalDateTime since);
}
