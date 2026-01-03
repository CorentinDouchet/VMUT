package com.mbda.mbdhackuity.controller;

import com.mbda.mbdhackuity.dto.CorrectiveActionDTO;
import com.mbda.mbdhackuity.service.CorrectiveActionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/corrective-actions")
public class CorrectiveActionController {

    @Autowired
    private CorrectiveActionService correctiveActionService;

    @GetMapping
    public ResponseEntity<List<CorrectiveActionDTO>> getCorrectiveActions() {
        List<CorrectiveActionDTO> actions = correctiveActionService.getCorrectiveActions();
        return ResponseEntity.ok(actions);
    }
}
