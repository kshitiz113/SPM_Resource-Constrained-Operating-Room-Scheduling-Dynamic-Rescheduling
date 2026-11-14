package com.orscheduler.util;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Accepts either a full ISO date-time ("2026-10-20T12:00:00") or a bare ISO date ("2026-10-20").
 * A bare date maps to the start of that day (or the end of the day for {@link EndOfDay}).
 */
public class FlexibleDateTimeDeserializer extends JsonDeserializer<LocalDateTime> {

    protected LocalTime timeForBareDate() {
        return LocalTime.MIDNIGHT;
    }

    @Override
    public LocalDateTime deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String text = p.getValueAsString();
        if (text == null || text.isBlank()) {
            return null;
        }
        text = text.trim();
        try {
            if (text.length() <= 10) {
                return LocalDate.parse(text).atTime(timeForBareDate());
            }
            if (text.endsWith("Z")) {
                text = text.substring(0, text.length() - 1);
            }
            return LocalDateTime.parse(text);
        } catch (java.time.format.DateTimeParseException e) {
            throw ctxt.weirdStringException(text, LocalDateTime.class, "Expected ISO date or date-time");
        }
    }

    public static class EndOfDay extends FlexibleDateTimeDeserializer {
        @Override
        protected LocalTime timeForBareDate() {
            return LocalTime.of(23, 59, 59);
        }
    }
}
