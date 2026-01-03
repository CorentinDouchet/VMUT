package com.mbda.mbdhackuity.dto;

import lombok.Data;
import java.util.List;

@Data
public class PageResponse<T> {
    private List<T> data;
    private Pagination pagination;

    @Data
    public static class Pagination {
        private int page;
        private int limit;
        private long total;
        private long totalPages;
    }
}