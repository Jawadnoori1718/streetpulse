package com.streetpulse.config;

import com.streetpulse.model.Incident;
import com.streetpulse.model.IncidentCategory;
import com.streetpulse.model.IncidentSeverity;
import com.streetpulse.repository.IncidentRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final IncidentRepository incidentRepository;

    public DataSeeder(IncidentRepository incidentRepository) {
        this.incidentRepository = incidentRepository;
    }

    @Override
    public void run(String... args) {
        if (incidentRepository.count() > 0) {
            System.out.println("[StreetPulse] Database already seeded — skipping.");
            return;
        }

        List<Incident> seeds = List.of(
            make("Broken street light outside station",
                 "The main lamp post outside the entrance has been out for two weeks. Very dark at night.",
                 IncidentCategory.LIGHTING, IncidentSeverity.HIGH,
                 51.5462, -0.4784, "Uxbridge Underground Station",
                 LocalDateTime.now().minusHours(3)),

            make("Suspicious group loitering near cashpoint",
                 "Three individuals watching ATM users on Uxbridge High Street.",
                 IncidentCategory.SUSPICIOUS, IncidentSeverity.HIGH,
                 51.5441, -0.4779, "Uxbridge High Street",
                 LocalDateTime.now().minusHours(7)),

            make("Unlit footpath along canal towpath",
                 "The stretch between Cowley Lock and the footbridge has no lighting at all.",
                 IncidentCategory.LIGHTING, IncidentSeverity.MEDIUM,
                 51.5365, -0.4652, "Grand Union Canal, Cowley",
                 LocalDateTime.now().minusDays(1)),

            make("Pothole and loose paving near Brunel main entrance",
                 "Several cracked slabs at the pedestrian crossing — trip hazard.",
                 IncidentCategory.HAZARD, IncidentSeverity.MEDIUM,
                 51.5326, -0.4756, "Brunel University",
                 LocalDateTime.now().minusDays(1).minusHours(4)),

            make("Broken pavement causing trip hazard",
                 "Raised slab on the pavement outside A&E entrance.",
                 IncidentCategory.HAZARD, IncidentSeverity.MEDIUM,
                 51.5414, -0.4540, "Hillingdon Hospital",
                 LocalDateTime.now().minusDays(2)),

            make("Poor lighting in market car park",
                 "Half the lights in the multi-storey car park are not working.",
                 IncidentCategory.LIGHTING, IncidentSeverity.HIGH,
                 51.5068, -0.4218, "Hayes Town Centre",
                 LocalDateTime.now().minusDays(2).minusHours(6)),

            make("Overgrown bushes blocking pavement",
                 "Hedgerow from a residential property hangs over the path forcing pedestrians into the road.",
                 IncidentCategory.HAZARD, IncidentSeverity.LOW,
                 51.5122, -0.3824, "Yeading Lane",
                 LocalDateTime.now().minusDays(3)),

            make("Abandoned vehicle blocking junction",
                 "Car has been left at the junction for several days, no tax or MOT visible.",
                 IncidentCategory.HAZARD, IncidentSeverity.MEDIUM,
                 51.5522, -0.4017, "South Ruislip",
                 LocalDateTime.now().minusDays(3).minusHours(2)),

            make("Street light flickering on approach road",
                 "Light strobes on and off; distracting for drivers approaching the roundabout.",
                 IncidentCategory.LIGHTING, IncidentSeverity.LOW,
                 51.5599, -0.4687, "Harefield Road",
                 LocalDateTime.now().minusDays(4)),

            make("Illegal fly-tipping blocking sight line",
                 "Large pile of rubbish bags dumped on the corner, blocking view of oncoming traffic.",
                 IncidentCategory.HAZARD, IncidentSeverity.MEDIUM,
                 51.5361, -0.4623, "Cowley Road",
                 LocalDateTime.now().minusDays(4).minusHours(5)),

            make("Road surface damage at Denham roundabout",
                 "Deep ruts and broken tarmac on the slip road entering the roundabout — dangerous at speed.",
                 IncidentCategory.HAZARD, IncidentSeverity.HIGH,
                 51.5716, -0.5074, "Denham Roundabout",
                 LocalDateTime.now().minusDays(5)),

            make("Harassment near court building",
                 "Individual was followed and verbally abused on the pavement outside the court.",
                 IncidentCategory.SUSPICIOUS, IncidentSeverity.HIGH,
                 51.5428, -0.4792, "Uxbridge Magistrates Court",
                 LocalDateTime.now().minusDays(5).minusHours(3)),

            make("Submerged footpath after heavy rain",
                 "Path flooded to ankle depth — no alternative route for pedestrians.",
                 IncidentCategory.HAZARD, IncidentSeverity.MEDIUM,
                 51.5320, -0.4701, "Colham Mill Road",
                 LocalDateTime.now().minusDays(6)),

            make("Graffiti obscuring road signs",
                 "Several directional signs spray-painted, making the junction confusing.",
                 IncidentCategory.HAZARD, IncidentSeverity.LOW,
                 51.5441, -0.4850, "Uxbridge Road West",
                 LocalDateTime.now().minusDays(6).minusHours(8)),

            make("Unlicensed street vendor causing obstruction",
                 "Trolley taking up half the pavement forcing people into the road.",
                 IncidentCategory.HAZARD, IncidentSeverity.LOW,
                 51.5455, -0.4770, "Uxbridge Market Square",
                 LocalDateTime.now().minusDays(7)),

            make("Suspicious vehicle parked outside school",
                 "Dark-windowed van has been parked opposite the school gates for three days.",
                 IncidentCategory.SUSPICIOUS, IncidentSeverity.HIGH,
                 51.5488, -0.4643, "Belmont Road, Uxbridge",
                 LocalDateTime.now().minusDays(8)),

            make("No lighting under railway bridge",
                 "The pedestrian underpass beneath the railway is completely unlit after dark.",
                 IncidentCategory.LIGHTING, IncidentSeverity.HIGH,
                 51.5342, -0.4725, "Iver Lane Bridge",
                 LocalDateTime.now().minusDays(9)),

            make("Loose drain cover on cycle path",
                 "Metal cover rocks and clangs loudly — a cyclist could catch a wheel.",
                 IncidentCategory.HAZARD, IncidentSeverity.MEDIUM,
                 51.5398, -0.4580, "Hillingdon Cycle Route",
                 LocalDateTime.now().minusDays(10)),

            make("Rowdy group outside off-licence",
                 "Gathering of around 8 people drinking outside the shop, blocking the entrance.",
                 IncidentCategory.SUSPICIOUS, IncidentSeverity.MEDIUM,
                 51.5475, -0.4801, "Long Lane, Uxbridge",
                 LocalDateTime.now().minusDays(11)),

            make("Damaged crash barrier on dual carriageway",
                 "Section of barrier knocked down, exposing a drop at the side of the road.",
                 IncidentCategory.HAZARD, IncidentSeverity.HIGH,
                 51.5150, -0.4350, "A4020 Western Avenue, Hayes",
                 LocalDateTime.now().minusDays(12))
        );

        incidentRepository.saveAll(seeds);
        System.out.println("[StreetPulse] Seeded " + seeds.size() + " incidents.");
    }

    private Incident make(String title, String description,
                           IncidentCategory category, IncidentSeverity severity,
                           double lat, double lng, String area, LocalDateTime reportedAt) {
        Incident inc = new Incident();
        inc.setTitle(title);
        inc.setDescription(description);
        inc.setCategory(category);
        inc.setSeverity(severity);
        inc.setLatitude(lat);
        inc.setLongitude(lng);
        inc.setArea(area);
        inc.setReportedAt(reportedAt);
        inc.setUpvotes(0);
        return inc;
    }
}
