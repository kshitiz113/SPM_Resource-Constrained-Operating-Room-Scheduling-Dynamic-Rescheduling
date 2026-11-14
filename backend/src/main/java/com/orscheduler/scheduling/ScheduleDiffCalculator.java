package com.orscheduler.scheduling;

import com.orscheduler.entity.ScheduleEntry;
import com.orscheduler.entity.SurgeryRequest;
import com.orscheduler.scheduling.model.ScheduleDiff;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.*;

@Component
public class ScheduleDiffCalculator {

    public ScheduleDiff computeDiff(
            List<ScheduleEntry> originalEntries,
            List<ScheduleEntry> newEntries,
            List<SurgeryRequest> newUnscheduled) {

        ScheduleDiff diff = new ScheduleDiff();

        Map<Long, ScheduleEntry> originalMap = new HashMap<>();
        if (originalEntries != null) {
            for (ScheduleEntry e : originalEntries) {
                if (e.getSurgeryRequest() != null) {
                    originalMap.put(e.getSurgeryRequest().getId(), e);
                }
            }
        }

        Map<Long, ScheduleEntry> newMap = new HashMap<>();
        if (newEntries != null) {
            for (ScheduleEntry e : newEntries) {
                if (e.getSurgeryRequest() != null) {
                    newMap.put(e.getSurgeryRequest().getId(), e);
                }
            }
        }

        // Check new entries against original
        for (ScheduleEntry ne : newEntries) {
            Long reqId = ne.getSurgeryRequest().getId();
            if (!originalMap.containsKey(reqId)) {
                diff.getAdded().add(ne);
            } else {
                ScheduleEntry oe = originalMap.get(reqId);
                boolean roomChanged = !Objects.equals(
                        oe.getOperatingRoom() != null ? oe.getOperatingRoom().getId() : null,
                        ne.getOperatingRoom() != null ? ne.getOperatingRoom().getId() : null);
                boolean timeChanged = !Objects.equals(oe.getPlannedStart(), ne.getPlannedStart());

                if (roomChanged || timeChanged) {
                    long shiftMin = Duration.between(oe.getPlannedStart(), ne.getPlannedStart()).toMinutes();
                    diff.getMoved().add(ScheduleDiff.MovedItem.builder()
                            .originalEntry(oe)
                            .newEntry(ne)
                            .shiftMinutes(shiftMin)
                            .build());
                } else {
                    diff.getUnchanged().add(ne);
                }
            }
        }

        // Check deferred / cancelled original entries
        for (ScheduleEntry oe : originalEntries) {
            Long reqId = oe.getSurgeryRequest().getId();
            if (!newMap.containsKey(reqId)) {
                // If it's in newUnscheduled, mark deferred, else cancelled
                boolean isDeferred = newUnscheduled != null && newUnscheduled.stream()
                        .anyMatch(u -> u.getId().equals(reqId));
                if (isDeferred) {
                    diff.getDeferred().add(oe.getSurgeryRequest());
                } else {
                    diff.getCancelled().add(oe);
                }
            }
        }

        return diff;
    }
}
