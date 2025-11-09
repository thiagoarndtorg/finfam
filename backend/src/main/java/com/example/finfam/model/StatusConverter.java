package com.example.finfam.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class StatusConverter implements AttributeConverter<FamilyMember.Status, String> {

    @Override
    public String convertToDatabaseColumn(FamilyMember.Status attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public FamilyMember.Status convertToEntityAttribute(String dbData) {
        return dbData == null ? null : FamilyMember.Status.valueOf(dbData.toUpperCase());
    }
}