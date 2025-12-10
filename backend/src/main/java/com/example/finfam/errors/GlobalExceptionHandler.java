package com.example.finfam.errors;

import com.example.finfam.dto.response.ErrorResponse;
import com.example.finfam.exception.CustomException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ErrorResponse> handleCustomException(CustomException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(e.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception e) {
        // Log the exception for debugging
        System.err.println("Unhandled exception: " + e.getMessage());
        e.printStackTrace();
        
        // Return a more informative error message in development
        String errorMessage = "Um erro inesperado ocorreu";
        if (e.getMessage() != null && !e.getMessage().isEmpty()) {
            errorMessage += ": " + e.getMessage();
        }
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse(errorMessage));
    }
}