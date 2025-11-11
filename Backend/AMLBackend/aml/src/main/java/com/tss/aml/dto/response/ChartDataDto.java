package com.tss.aml.dto.response;

import java.util.List;

public class ChartDataDto {
    private List<String> labels;
    private List<Long> values;
    private List<String> colors;

    // Constructors
    public ChartDataDto() {}

    public ChartDataDto(List<String> labels, List<Long> values) {
        this.labels = labels;
        this.values = values;
    }

    public ChartDataDto(List<String> labels, List<Long> values, List<String> colors) {
        this.labels = labels;
        this.values = values;
        this.colors = colors;
    }

    // Getters and Setters
    public List<String> getLabels() {
        return labels;
    }

    public void setLabels(List<String> labels) {
        this.labels = labels;
    }

    public List<Long> getValues() {
        return values;
    }

    public void setValues(List<Long> values) {
        this.values = values;
    }

    public List<String> getColors() {
        return colors;
    }

    public void setColors(List<String> colors) {
        this.colors = colors;
    }
}
