package com.mbda.mbdhackuity.dto;

import lombok.Data;

@Data
public class CommentRequest {
    private String comment;
    private String author;
    private String role; // 'analyst' ou 'validator'
}