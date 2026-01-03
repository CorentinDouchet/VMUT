package com.mbda.mbdhackuity.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "scan_import_logs")
@Data
public class ScanImportLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "scan_import_id")
    private Long scanImportId;

    @Column(length = 20)
    private String level;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "package_name")
    private String packageName;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}