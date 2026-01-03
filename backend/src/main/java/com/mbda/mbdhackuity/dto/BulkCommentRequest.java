package com.mbda.mbdhackuity.dto;

import lombok.Data;
import java.util.List;

@Data
public class BulkCommentRequest {
    private List<Long> ids;
    private String comment;
    private String author;
    private String role;
}