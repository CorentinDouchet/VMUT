package com.mbda.mbdhackuity.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "scan_imports")
@Data
public class ScanImport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "scan_name", unique = true, nullable = false)
    private String scanName;

    @Column(name = "file_name")
    private String fileName;

    @Column(length = 50)
    private String status = "pending";

    @Column(name = "total_packages")
    private Integer totalPackages = 0;

    @Column(name = "imported_packages")
    private Integer importedPackages = 0;

    @Column(name = "failed_packages")
    private Integer failedPackages = 0;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}