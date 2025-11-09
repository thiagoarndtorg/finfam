package com.example.finfam.service;

import com.example.finfam.dto.request.CategoryRequest;
import com.example.finfam.dto.response.CategoryResponse;
import com.example.finfam.model.Category;
import com.example.finfam.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository categoryRepository;

    public CategoryResponse create(CategoryRequest request) {
        if (categoryRepository.existsByFamilyIdAndName(request.getFamilyId(), request.getName())) {
            throw new IllegalArgumentException("Category name already exists for this family");
        }
        Category category = new Category();
        category.setFamilyId(request.getFamilyId());
        category.setName(request.getName());
        category.setIcon(request.getIcon() == null ? "📁" : request.getIcon());
        category.setColor(request.getColor() == null ? "#0ea5e9" : request.getColor());
        category.setIsIncome(Boolean.TRUE.equals(request.getIsIncome()));
        category.setIsSystem(false);
        Category saved = categoryRepository.save(category);
        return toResponse(saved);
    }

    public CategoryResponse update(Integer id, Integer familyId, CategoryRequest request) {
        Category category = categoryRepository.findByIdAndFamilyId(id, familyId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));
        if (!category.getName().equals(request.getName()) &&
                categoryRepository.existsByFamilyIdAndName(familyId, request.getName())) {
            throw new IllegalArgumentException("Category name already exists for this family");
        }
        category.setName(request.getName());
        if (request.getIcon() != null) category.setIcon(request.getIcon());
        if (request.getColor() != null) category.setColor(request.getColor());
        if (request.getIsIncome() != null) category.setIsIncome(request.getIsIncome());
        Category saved = categoryRepository.save(category);
        return toResponse(saved);
    }

    public void delete(Integer id, Integer familyId) {
        Category category = categoryRepository.findByIdAndFamilyId(id, familyId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));
        if (Boolean.TRUE.equals(category.getIsSystem())) {
            throw new IllegalStateException("System categories cannot be deleted");
        }
        categoryRepository.delete(category);
    }

    public CategoryResponse get(Integer id, Integer familyId) {
        Category category = categoryRepository.findByIdAndFamilyId(id, familyId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));
        return toResponse(category);
    }

    public List<CategoryResponse> list(Integer familyId, Boolean isIncome) {
        return categoryRepository.findByFamilyIdAndOptionalIsIncome(familyId, isIncome)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    private CategoryResponse toResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .familyId(category.getFamilyId())
                .name(category.getName())
                .icon(category.getIcon())
                .color(category.getColor())
                .isIncome(category.getIsIncome())
                .isSystem(category.getIsSystem())
                .build();
    }
}



