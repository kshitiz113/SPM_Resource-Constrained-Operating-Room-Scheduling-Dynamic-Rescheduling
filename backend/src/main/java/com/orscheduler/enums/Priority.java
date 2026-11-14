package com.orscheduler.enums;

public enum Priority {
    EMERGENCY(100),
    URGENT(50),
    ELECTIVE(10);

    private final int weight;

    Priority(int weight) {
        this.weight = weight;
    }

    public int getWeight() {
        return weight;
    }
}
