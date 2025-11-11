package com.tss.aml.dto.response;

import java.util.List;

public class AlertTrendDto {
    private List<String> labels;
    private List<DatasetDto> datasets;

    // Constructors
    public AlertTrendDto() {}

    public AlertTrendDto(List<String> labels, List<DatasetDto> datasets) {
        this.labels = labels;
        this.datasets = datasets;
    }

    // Getters and Setters
    public List<String> getLabels() {
        return labels;
    }

    public void setLabels(List<String> labels) {
        this.labels = labels;
    }

    public List<DatasetDto> getDatasets() {
        return datasets;
    }

    public void setDatasets(List<DatasetDto> datasets) {
        this.datasets = datasets;
    }

    // Inner class for dataset
    public static class DatasetDto {
        private String label;
        private List<Long> data;
        private String color;

        public DatasetDto() {}

        public DatasetDto(String label, List<Long> data, String color) {
            this.label = label;
            this.data = data;
            this.color = color;
        }

        public String getLabel() {
            return label;
        }

        public void setLabel(String label) {
            this.label = label;
        }

        public List<Long> getData() {
            return data;
        }

        public void setData(List<Long> data) {
            this.data = data;
        }

        public String getColor() {
            return color;
        }

        public void setColor(String color) {
            this.color = color;
        }
    }
}
