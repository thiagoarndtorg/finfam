package com.example.finfam.service;

import com.example.finfam.dto.request.InviteFamilyMemberRequest;
import com.example.finfam.dto.request.UpdateMemberRoleRequest;
import com.example.finfam.dto.response.FamilyMemberResponse;
import com.example.finfam.exception.CustomException;
import com.example.finfam.model.Family;
import com.example.finfam.model.FamilyMember;
import com.example.finfam.model.User;
import com.example.finfam.repository.FamilyMemberRepository;
import com.example.finfam.repository.FamilyRepository;
import com.example.finfam.repository.UserRepository;
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
class FamilyMemberServiceTest {

    @Mock
    private FamilyMemberRepository familyMemberRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private EmailService emailService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FamilyRepository familyRepository;

    @InjectMocks
    private FamilyMemberService familyMemberService;

    private User adminUser;
    private User memberUser;
    private Family family;
    private FamilyMember adminMember;
    private String validToken;

    @BeforeEach
    void setUp() {
        adminUser = User.builder()
                .id(1)
                .email("admin@example.com")
                .username("admin")
                .build();

        memberUser = User.builder()
                .id(2)
                .email("member@example.com")
                .username("member")
                .build();

        family = new Family();
        family.setId(1);
        family.setName("Test Family");
        family.setCreatedBy(adminUser);

        adminMember = new FamilyMember();
        adminMember.setId(1);
        adminMember.setUser(adminUser);
        adminMember.setFamily(family);
        adminMember.setRole(FamilyMember.Role.ADMIN);
        adminMember.setStatus(FamilyMember.Status.ACTIVE);

        validToken = "Bearer validToken";
    }

    @Test
    void testInviteMember_Success() {
        InviteFamilyMemberRequest request = InviteFamilyMemberRequest.builder()
                .email("newmember@example.com")
                .role("MEMBER")
                .build();

        when(jwtService.extractUserId(anyString())).thenReturn(1);
        when(familyMemberRepository.findByUserIdAndFamilyIdAndRole(1, 1, FamilyMember.Role.ADMIN))
                .thenReturn(Optional.of(adminMember));
        when(userRepository.findByEmail("newmember@example.com")).thenReturn(Optional.of(memberUser));
        when(familyMemberRepository.existsByUserIdAndFamilyId(2, 1)).thenReturn(false);
        when(familyRepository.findById(1)).thenReturn(Optional.of(family));
        when(familyMemberRepository.save(any(FamilyMember.class))).thenReturn(adminMember);
        when(jwtService.generateFamilyInvitationToken(anyString(), anyInt())).thenReturn("inviteToken");
        when(userRepository.findById(1)).thenReturn(Optional.of(adminUser));
        doNothing().when(emailService).sendInvitationEmail(anyString(), anyString(), anyString(), anyString());

        assertDoesNotThrow(() -> {
            familyMemberService.inviteMember(1, validToken, request);
        });

        verify(familyMemberRepository).save(any(FamilyMember.class));
        verify(emailService).sendInvitationEmail(anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void testInviteMember_NotAdmin_ThrowsException() {
        InviteFamilyMemberRequest request = InviteFamilyMemberRequest.builder()
                .email("newmember@example.com")
                .role("MEMBER")
                .build();

        when(jwtService.extractUserId(anyString())).thenReturn(2);
        when(familyMemberRepository.findByUserIdAndFamilyIdAndRole(2, 1, FamilyMember.Role.ADMIN))
                .thenReturn(Optional.empty());

        assertThrows(CustomException.class, () -> {
            familyMemberService.inviteMember(1, validToken, request);
        });

        verify(familyMemberRepository, never()).save(any(FamilyMember.class));
    }

    @Test
    void testInviteMember_UserAlreadyMember_ThrowsException() {
        InviteFamilyMemberRequest request = InviteFamilyMemberRequest.builder()
                .email("member@example.com")
                .role("MEMBER")
                .build();

        when(jwtService.extractUserId(anyString())).thenReturn(1);
        when(familyMemberRepository.findByUserIdAndFamilyIdAndRole(1, 1, FamilyMember.Role.ADMIN))
                .thenReturn(Optional.of(adminMember));
        when(userRepository.findByEmail("member@example.com")).thenReturn(Optional.of(memberUser));
        when(familyMemberRepository.existsByUserIdAndFamilyId(2, 1)).thenReturn(true);

        assertThrows(CustomException.class, () -> {
            familyMemberService.inviteMember(1, validToken, request);
        });

        verify(familyMemberRepository, never()).save(any(FamilyMember.class));
    }

    @Test
    void testListFamilyMembers_Success() {
        when(jwtService.extractUserId(anyString())).thenReturn(1);
        when(familyMemberRepository.existsByUserIdAndFamilyId(1, 1)).thenReturn(true);
        when(familyMemberRepository.findByFamilyIdWithUserAndStatuses(eq(1), anyList()))
                .thenReturn(Arrays.asList(adminMember));

        List<FamilyMemberResponse> result = familyMemberService.listFamilyMembers(1, validToken);

        assertNotNull(result);
        assertEquals(1, result.size());
        verify(familyMemberRepository).findByFamilyIdWithUserAndStatuses(eq(1), anyList());
    }

    @Test
    void testListFamilyMembers_NoAccess_ThrowsException() {
        when(jwtService.extractUserId(anyString())).thenReturn(2);
        when(familyMemberRepository.existsByUserIdAndFamilyId(2, 1)).thenReturn(false);

        assertThrows(CustomException.class, () -> {
            familyMemberService.listFamilyMembers(1, validToken);
        });
    }

    @Test
    void testUpdateMemberRole_Success() {
        UpdateMemberRoleRequest request = UpdateMemberRoleRequest.builder()
                .role("ADMIN")
                .build();

        FamilyMember memberToUpdate = new FamilyMember();
        memberToUpdate.setId(2);
        memberToUpdate.setUser(memberUser);
        memberToUpdate.setFamily(family);
        memberToUpdate.setRole(FamilyMember.Role.MEMBER);

        when(jwtService.extractUserId(anyString())).thenReturn(1);
        when(familyMemberRepository.findByUserIdAndFamilyIdAndRole(1, 1, FamilyMember.Role.ADMIN))
                .thenReturn(Optional.of(adminMember));
        when(familyMemberRepository.findById(2)).thenReturn(Optional.of(memberToUpdate));
        when(familyMemberRepository.save(any(FamilyMember.class))).thenReturn(memberToUpdate);

        assertDoesNotThrow(() -> {
            familyMemberService.updateMemberRole(1, 2, validToken, request);
        });

        verify(familyMemberRepository).save(any(FamilyMember.class));
    }

    @Test
    void testIsAdmin_ReturnsTrue() {
        when(familyMemberRepository.findByUserIdAndFamilyIdAndRole(1, 1, FamilyMember.Role.ADMIN))
                .thenReturn(Optional.of(adminMember));

        boolean result = familyMemberService.isAdmin(1, 1);

        assertTrue(result);
    }

    @Test
    void testIsAdmin_ReturnsFalse() {
        when(familyMemberRepository.findByUserIdAndFamilyIdAndRole(2, 1, FamilyMember.Role.ADMIN))
                .thenReturn(Optional.empty());

        boolean result = familyMemberService.isAdmin(2, 1);

        assertFalse(result);
    }
}

