package com.example.finfam;

import com.example.finfam.controller.AuthController;
import com.example.finfam.dto.request.LoginRequest;
import com.example.finfam.dto.request.RegisterRequest;
import com.example.finfam.dto.response.AuthenticationResponse;
import com.example.finfam.service.AuthenticationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Mock
    private AuthenticationService authenticationService;

    @InjectMocks
    private AuthController authController;

    private ObjectMapper objectMapper;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
        objectMapper = new ObjectMapper();
    }

    @Test
    public void testRegister() throws Exception {
        RegisterRequest registerRequest = RegisterRequest.builder()
                .email("test@example.com")
                .username("testuser")
                .password("password123")
                .build();

        AuthenticationResponse authResponse = AuthenticationResponse.builder()
                .token("some-jwt-token")
                .username("testuser")
                .build();

        when(authenticationService.register(registerRequest)).thenReturn(authResponse);

        mockMvc.perform(post("/api/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("some-jwt-token"))
                .andExpect(jsonPath("$.username").value("testuser"));

        verify(authenticationService, times(1)).register(registerRequest);
    }

    @Test
    public void testLogin() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .email("test@example.com")
                .password("password123")
                .build();

        AuthenticationResponse authResponse = AuthenticationResponse.builder()
                .token("some-jwt-token")
                .username("testuser")
                .build();

        when(authenticationService.login(loginRequest)).thenReturn(authResponse);

        mockMvc.perform(post("/api/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("some-jwt-token"))
                .andExpect(jsonPath("$.username").value("testuser"));

        verify(authenticationService, times(1)).login(loginRequest);
    }
}
