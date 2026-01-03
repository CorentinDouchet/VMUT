package com.mbda.mbdhackuity.service;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MatchingResult {
    private String scanName;
    private int totalPackages;
    private int vulnerablePackages;
    private int totalVulnerabilities;
    private long elapsedSeconds;
}