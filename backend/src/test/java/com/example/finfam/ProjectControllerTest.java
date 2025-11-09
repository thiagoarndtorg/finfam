package com.example.finfam;

import com.example.finfam.dto.UserDTO;
import com.example.finfam.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.Arrays;
import java.util.List;

public class ProjectControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ProjectService projectService;

    @Mock
    private UserService userService;

    @InjectMocks
    private ProjectController projectController;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(projectController).build();
    }

    @Test
    public void testCreateProject() throws Exception {
        ProjectDTO projectDTO = ProjectDTO.builder()
                .projectId(1)
                .projectName("Test Project")
                .build();

        when(projectService.createProject(any(ProjectDTO.class))).thenReturn(projectDTO);

        mockMvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"projectName\": \"Test Project\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.projectId").value(1))
                .andExpect(jsonPath("$.projectName").value("Test Project"));

        verify(projectService, times(1)).createProject(any(ProjectDTO.class));
    }

    @Test
    public void testGetUserProjects() throws Exception {
        ProjectDTO projectDTO1 = ProjectDTO.builder().projectId(1).projectName("Project 1").build();
        ProjectDTO projectDTO2 = ProjectDTO.builder().projectId(2).projectName("Project 2").build();
        List<ProjectDTO> projects = Arrays.asList(projectDTO1, projectDTO2);

        when(projectService.getUserProjects()).thenReturn(projects);

        mockMvc.perform(get("/api/projects"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].projectId").value(1))
                .andExpect(jsonPath("$[0].projectName").value("Project 1"))
                .andExpect(jsonPath("$[1].projectId").value(2))
                .andExpect(jsonPath("$[1].projectName").value("Project 2"));

        verify(projectService, times(1)).getUserProjects();
    }

    @Test
    public void testGetProject() throws Exception {
        ProjectDTO projectDTO = ProjectDTO.builder()
                .projectId(1)
                .projectName("Test Project")
                .build();

        when(projectService.getProject(1)).thenReturn(projectDTO);

        mockMvc.perform(get("/api/projects/{id}", 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.projectId").value(1))
                .andExpect(jsonPath("$.projectName").value("Test Project"));

        verify(projectService, times(1)).getProject(1);
    }

    @Test
    public void testUpdateProject() throws Exception {
        ProjectDTO projectDTO = ProjectDTO.builder()
                .projectId(1)
                .projectName("Updated Project")
                .build();

        when(projectService.updateProject(eq(1), any(ProjectDTO.class))).thenReturn(projectDTO);

        mockMvc.perform(put("/api/projects/{id}", 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"projectName\": \"Updated Project\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.projectId").value(1))
                .andExpect(jsonPath("$.projectName").value("Updated Project"));

        verify(projectService, times(1)).updateProject(eq(1), any(ProjectDTO.class));
    }

    @Test
    public void testDeleteProject() throws Exception {
        doNothing().when(projectService).deleteProject(1);

        mockMvc.perform(delete("/api/projects/{id}", 1))
                .andExpect(status().isNoContent());

        verify(projectService, times(1)).deleteProject(1);
    }

    @Test
    public void testGetUsersByProjectId() throws Exception {
        UserDTO userDTO = UserDTO.builder().userId(1).username("user1").build();
        List<UserDTO> users = Arrays.asList(userDTO);

        when(projectService.getUsersByProjectId(1)).thenReturn(users);

        mockMvc.perform(get("/api/projects/{id}/users", 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].userId").value(1))
                .andExpect(jsonPath("$[0].username").value("user1"));

        verify(projectService, times(1)).getUsersByProjectId(1);
    }

    @Test
    public void testExitProject() throws Exception {
        doNothing().when(projectService).exitProject(1);

        mockMvc.perform(post("/api/projects/exit/{id}", 1))
                .andExpect(status().isNoContent());

        verify(projectService, times(1)).exitProject(1);
    }
}
