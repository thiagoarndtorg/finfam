package com.example.finfam;

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

import java.time.LocalDate;
import java.util.Arrays;

public class TaskControllerTest {

    private MockMvc mockMvc;

    @Mock
    private TaskService taskService;

    @InjectMocks
    private TaskController taskController;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(taskController).build();
    }

    @Test
    public void testCreateTask() throws Exception {
        TaskRequest taskRequest = TaskRequest.builder()
                .taskId(1)
                .taskName("Task 1")
                .groupId(1)
                .assignedTo(1)
                .status(TaskStatus.TODO)
                .dueDate(LocalDate.now())
                .build();

        TaskResponse taskResponse = TaskResponse.builder()
                .taskId(1)
                .taskName("Task 1")
                .groupId(1)
                .assignedTo(null)
                .status(TaskStatus.TODO)
                .dueDate(LocalDate.now())
                .comments(null)
                .build();

        when(taskService.createTask(any(TaskRequest.class))).thenReturn(taskResponse);

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"taskId\": 1, \"taskName\": \"Task 1\", \"groupId\": 1, \"assignedTo\": 1, \"status\": \"TODO\", \"dueDate\": \"2024-11-26\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.taskId").value(1))
                .andExpect(jsonPath("$.taskName").value("Task 1"))
                .andExpect(jsonPath("$.status").value("TODO"));

        verify(taskService, times(1)).createTask(any(TaskRequest.class));
    }

    @Test
    public void testGetGroupTasks() throws Exception {
        TaskResponse taskResponse1 = TaskResponse.builder()
                .taskId(1)
                .taskName("Task 1")
                .groupId(1)
                .assignedTo(null)
                .status(TaskStatus.TODO)
                .dueDate(LocalDate.now())
                .comments(null)
                .build();

        TaskResponse taskResponse2 = TaskResponse.builder()
                .taskId(2)
                .taskName("Task 2")
                .groupId(1)
                .assignedTo(null)
                .status(TaskStatus.IN_PROGRESS)
                .dueDate(LocalDate.now())
                .comments(null)
                .build();

        when(taskService.getGroupTasks(1)).thenReturn(Arrays.asList(taskResponse1, taskResponse2));

        mockMvc.perform(get("/api/tasks/group/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].taskId").value(1))
                .andExpect(jsonPath("$[0].taskName").value("Task 1"))
                .andExpect(jsonPath("$[1].taskId").value(2))
                .andExpect(jsonPath("$[1].taskName").value("Task 2"));

        verify(taskService, times(1)).getGroupTasks(1);
    }

    @Test
    public void testUpdateTask() throws Exception {
        TaskRequest taskRequest = TaskRequest.builder()
                .taskId(1)
                .taskName("Updated Task")
                .groupId(1)
                .assignedTo(1)
                .status(TaskStatus.IN_PROGRESS)
                .dueDate(LocalDate.now())
                .build();

        TaskResponse taskResponse = TaskResponse.builder()
                .taskId(1)
                .taskName("Updated Task")
                .groupId(1)
                .assignedTo(null)
                .status(TaskStatus.IN_PROGRESS)
                .dueDate(LocalDate.now())
                .comments(null)
                .build();

        when(taskService.updateTask(eq(1), any(TaskRequest.class))).thenReturn(taskResponse);

        mockMvc.perform(put("/api/tasks/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"taskId\": 1, \"taskName\": \"Updated Task\", \"groupId\": 1, \"assignedTo\": 1, \"status\": \"IN_PROGRESS\", \"dueDate\": \"2024-11-26\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.taskId").value(1))
                .andExpect(jsonPath("$.taskName").value("Updated Task"));

        verify(taskService, times(1)).updateTask(eq(1), any(TaskRequest.class));
    }

    @Test
    public void testDeleteTask() throws Exception {
        doNothing().when(taskService).deleteTask(1);

        mockMvc.perform(delete("/api/tasks/1"))
                .andExpect(status().isNoContent());

        verify(taskService, times(1)).deleteTask(1);
    }
}
