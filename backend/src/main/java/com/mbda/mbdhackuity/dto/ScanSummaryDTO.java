package com.mbda.mbdhackuity.dto;

import lombok.Data;

@Data
public class ScanSummaryDTO {
    private String scanName;
    private Integer packageCount;
    private Object scanDate;
    private String osName;
    private String osVersion;
    private String hostname;
}