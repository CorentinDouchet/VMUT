package com.mbda.mbdhackuity.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComplianceRuleDTO {
    private Long id;
    private String reference;
    private String name;
    private String description;
    private String framework;
    private String level;
    private String status;
    private String lastCheck; // Formatted date string
    private String remediationSteps;
    private Integer affectedAssets;
    private Boolean autoCheck;
}
