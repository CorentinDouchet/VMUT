package com.mbda.mbdhackuity.service;

import com.mbda.mbdhackuity.entity.TechnologyObsolescence;
import com.mbda.mbdhackuity.repository.TechnologyObsolescenceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class TechnologyObsolescenceService {

    @Autowired
    private TechnologyObsolescenceRepository obsolescenceRepository;

    @Autowired
    private AuthenticationService authenticationService;

    public List<TechnologyObsolescence> findAll() {
        return obsolescenceRepository.findAll();
    }

    public List<TechnologyObsolescence> findObsolete() {
        return obsolescenceRepository.findByIsObsolete(true);
    }

    public List<TechnologyObsolescence> findByTechnology(String technologyName) {
        return obsolescenceRepository.findByTechnologyName(technologyName);
    }

    public Optional<TechnologyObsolescence> findById(Long id) {
        return obsolescenceRepository.findById(id);
    }

    public TechnologyObsolescence save(TechnologyObsolescence obsolescence) {
        String currentUser = authenticationService.getCurrentUsername();
        
        if (obsolescence.getId() == null) {
            // Création
            obsolescence.setCreatedBy(currentUser != null ? currentUser : "system");
            obsolescence.setCreatedAt(LocalDate.now());
        }
        
        obsolescence.setUpdatedAt(LocalDate.now());
        return obsolescenceRepository.save(obsolescence);
    }

    public void delete(Long id) {
        obsolescenceRepository.deleteById(id);
    }

    public Optional<TechnologyObsolescence> findObsoleteByTechnology(String technologyName) {
        return obsolescenceRepository.findObsoleteByTechnology(technologyName);
    }
}
