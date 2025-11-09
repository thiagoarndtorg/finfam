package com.example.finfam;

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

import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

public class GroupControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Mock
    private GroupService groupService;

    @InjectMocks
    private GroupController groupController;

    private ObjectMapper objectMapper;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(groupController).build();
        objectMapper = new ObjectMapper();
    }

    @Test
    public void testCreateGroup() throws Exception {
        GroupDTO groupDTO = GroupDTO.builder()
                .groupId(1)
                .groupName("Group 1")
                .projectId(1)
                .build();

        when(groupService.createGroup(any(GroupDTO.class))).thenReturn(groupDTO);

        mockMvc.perform(post("/api/groups")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(groupDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.groupName").value("Group 1"));

        verify(groupService, times(1)).createGroup(any(GroupDTO.class));
    }

    @Test
    public void testGetProjectGroups() throws Exception {
        GroupDTO groupDTO = GroupDTO.builder()
                .groupId(1)
                .groupName("Group 1")
                .projectId(1)
                .build();

        when(groupService.getProjectGroups(1)).thenReturn(List.of(groupDTO));

        mockMvc.perform(get("/api/groups/project/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].groupName").value("Group 1"));

        verify(groupService, times(1)).getProjectGroups(1);
    }

    @Test
    public void testUpdateGroup() throws Exception {
        GroupDTO groupDTO = GroupDTO.builder()
                .groupId(1)
                .groupName("Updated Group")
                .projectId(1)
                .build();

        when(groupService.updateGroup(eq(1), any(GroupDTO.class))).thenReturn(groupDTO);

        mockMvc.perform(put("/api/groups/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(groupDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.groupName").value("Updated Group"));

        verify(groupService, times(1)).updateGroup(eq(1), any(GroupDTO.class));
    }

    @Test
    public void testDeleteGroup() throws Exception {
        doNothing().when(groupService).deleteGroup(1);

        mockMvc.perform(delete("/api/groups/1"))
                .andExpect(status().isNoContent());

        verify(groupService, times(1)).deleteGroup(1);
    }
}
