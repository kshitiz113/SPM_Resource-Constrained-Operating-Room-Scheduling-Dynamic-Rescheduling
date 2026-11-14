package com.orscheduler.scheduling;

import com.orscheduler.entity.SurgeryRequest;
import com.orscheduler.enums.Priority;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Component
public class RequestRanker {

    public List<SurgeryRequest> rankRequests(List<SurgeryRequest> requests, LocalDateTime referenceTime) {
        if (requests == null || requests.isEmpty()) {
            return new ArrayList<>();
        }

        List<SurgeryRequest> sorted = new ArrayList<>(requests);
        sorted.sort(Comparator.comparingDouble((SurgeryRequest req) -> calculateRankScore(req, referenceTime)).reversed());
        return sorted;
    }

    public double calculateRankScore(SurgeryRequest request, LocalDateTime referenceTime) {
        double priorityScore;
        Priority priority = request.getPriority() != null ? request.getPriority() : Priority.ELECTIVE;
        switch (priority) {
            case EMERGENCY:
                priorityScore = 100000.0;
                break;
            case URGENT:
                priorityScore = 50000.0;
                break;
            case ELECTIVE:
            default:
                priorityScore = 10000.0;
                break;
        }

        double waitingHours = 0.0;
        if (request.getRequestedAt() != null && referenceTime.isAfter(request.getRequestedAt())) {
            waitingHours = Duration.between(request.getRequestedAt(), referenceTime).toMinutes() / 60.0;
        }

        double deadlineProximityScore = 0.0;
        if (request.getSchedulingDeadline() != null) {
            long hoursToDeadline = Duration.between(referenceTime, request.getSchedulingDeadline()).toHours();
            if (hoursToDeadline <= 0) {
                deadlineProximityScore = 5000.0; // Overdue deadline gets max urgency
            } else if (hoursToDeadline < 24) {
                deadlineProximityScore = 2000.0 / Math.max(1, hoursToDeadline);
            } else {
                deadlineProximityScore = 500.0 / Math.max(1, hoursToDeadline);
            }
        }

        return priorityScore + (waitingHours * 10.0) + deadlineProximityScore;
    }
}
