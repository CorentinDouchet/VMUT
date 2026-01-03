package com.mbda.mbdhackuity.controller;

import com.mbda.mbdhackuity.service.CweService;
import org.springframework.beans.factory.annotation.Autowired;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/cwe")
@Tag(name = "CWE", description = "Référentiel des types de faiblesses (CWE)")
public class CweController {

    @Autowired
    private CweService cweService;

    @GetMapping("/{cweId}")
    public ResponseEntity<Map<String, String>> getCweDescription(@PathVariable String cweId) {
        CweService.CweInfo info = cweService.getCweInfo(cweId);
        Map<String, String> response = new HashMap<>();
        response.put("cweId", cweId);
        response.put("name", info != null ? info.name : "");
        response.put("description", info != null ? info.description : "");
        return ResponseEntity.ok(response);
    }
}
