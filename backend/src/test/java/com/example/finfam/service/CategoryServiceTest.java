package com.example.finfam.service;

import com.example.finfam.dto.request.CategoryRequest;
import com.example.finfam.dto.response.CategoryResponse;
import com.example.finfam.model.Category;
import com.example.finfam.repository.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryService categoryService;

    private CategoryRequest categoryRequest;
    private Category category;

    @BeforeEach
    void setUp() {
        categoryRequest = new CategoryRequest();
        categoryRequest.setFamilyId(1);
        categoryRequest.setName("Food");
        categoryRequest.setIcon("🍔");
        categoryRequest.setColor("#FF5733");
        categoryRequest.setIsIncome(false);

        category = new Category();
        category.setId(1);
        category.setFamilyId(1);
        category.setName("Food");
        category.setIcon("🍔");
        category.setColor("#FF5733");
        category.setIsIncome(false);
        category.setIsSystem(false);
    }

    @Test
    void testCreate_Success() {
        when(categoryRepository.existsByFamilyIdAndName(1, "Food")).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenReturn(category);

        CategoryResponse response = categoryService.create(categoryRequest);

        assertNotNull(response);
        assertEquals(1, response.getId());
        assertEquals("Food", response.getName());
        assertEquals(1, response.getFamilyId());
        verify(categoryRepository).save(any(Category.class));
    }

    @Test
    void testCreate_DuplicateName_ThrowsException() {
        when(categoryRepository.existsByFamilyIdAndName(1, "Food")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> {
            categoryService.create(categoryRequest);
        });

        verify(categoryRepository, never()).save(any(Category.class));
    }

    @Test
    void testUpdate_Success() {
        categoryRequest.setName("Updated Food");
        when(categoryRepository.findByIdAndFamilyId(1, 1)).thenReturn(Optional.of(category));
        when(categoryRepository.existsByFamilyIdAndName(1, "Updated Food")).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenReturn(category);

        CategoryResponse response = categoryService.update(1, 1, categoryRequest);

        assertNotNull(response);
        verify(categoryRepository).save(any(Category.class));
    }

    @Test
    void testUpdate_CategoryNotFound_ThrowsException() {
        when(categoryRepository.findByIdAndFamilyId(1, 1)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> {
            categoryService.update(1, 1, categoryRequest);
        });

        verify(categoryRepository, never()).save(any(Category.class));
    }

    @Test
    void testDelete_Success() {
        when(categoryRepository.findByIdAndFamilyId(1, 1)).thenReturn(Optional.of(category));
        doNothing().when(categoryRepository).delete(any(Category.class));

        assertDoesNotThrow(() -> {
            categoryService.delete(1, 1);
        });

        verify(categoryRepository).delete(category);
    }

    @Test
    void testDelete_SystemCategory_ThrowsException() {
        category.setIsSystem(true);
        when(categoryRepository.findByIdAndFamilyId(1, 1)).thenReturn(Optional.of(category));

        assertThrows(IllegalStateException.class, () -> {
            categoryService.delete(1, 1);
        });

        verify(categoryRepository, never()).delete(any(Category.class));
    }

    @Test
    void testGet_Success() {
        when(categoryRepository.findByIdAndFamilyId(1, 1)).thenReturn(Optional.of(category));

        CategoryResponse response = categoryService.get(1, 1);

        assertNotNull(response);
        assertEquals(1, response.getId());
        assertEquals("Food", response.getName());
    }

    @Test
    void testList_Success() {
        when(categoryRepository.findByFamilyIdAndOptionalIsIncome(1, null))
                .thenReturn(Arrays.asList(category));

        List<CategoryResponse> result = categoryService.list(1, null);

        assertNotNull(result);
        assertEquals(1, result.size());
        verify(categoryRepository).findByFamilyIdAndOptionalIsIncome(1, null);
    }
}

