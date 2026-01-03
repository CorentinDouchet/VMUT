package com.mbda.mbdhackuity.controller;

import com.mbda.mbdhackuity.service.StatsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    @Autowired
    private StatsService statsService;

    // GET /api/stats - Statistiques globales
    @GetMapping
    public ResponseEntity<Map<String, Object>> getGlobalStats() {
        return ResponseEntity.ok(statsService.getGlobalStats());
    }

    // GET /api/stats/trends - Tendances temporelles
    @GetMapping("/trends")
    public ResponseEntity<List<Map<String, Object>>> getTrends() {
        return ResponseEntity.ok(statsService.getTrends());
    }
}