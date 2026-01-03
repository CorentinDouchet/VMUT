package com.mbda.mbdhackuity.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class CvssScoreUpdateRequest {
    private BigDecimal score;
    private String vector;
    private String severity;
    private String modifiedBy;
}