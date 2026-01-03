package com.mbda.mbdhackuity.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComplianceStatsDTO {
    private Long totalRules;
    private Long compliantCount;
    private Long nonCompliantCount;
    private Long partialCount;
    private Long notCheckedCount;
    private Double complianceRate; // Percentage
}
