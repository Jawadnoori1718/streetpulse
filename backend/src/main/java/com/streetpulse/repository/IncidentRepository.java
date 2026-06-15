package com.streetpulse.repository;

import com.streetpulse.model.Incident;
import com.streetpulse.model.IncidentCategory;
import com.streetpulse.model.IncidentSeverity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, Long> {

    List<Incident> findByCategory(IncidentCategory category);
    List<Incident> findBySeverity(IncidentSeverity severity);
    List<Incident> findByAreaIgnoreCase(String area);
    List<Incident> findByCategoryAndSeverity(IncidentCategory category, IncidentSeverity severity);
    List<Incident> findByReportedAtAfter(LocalDateTime since);

    long countByCategory(IncidentCategory category);
    long countBySeverity(IncidentSeverity severity);

    @Query("SELECT i.area FROM Incident i GROUP BY i.area ORDER BY COUNT(i) DESC LIMIT 1")
    String findMostActiveArea();

    List<Incident> findTop20ByOrderByReportedAtDesc();
}
