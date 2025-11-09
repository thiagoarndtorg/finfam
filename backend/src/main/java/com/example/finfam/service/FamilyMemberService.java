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
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FamilyMemberService {

    private final FamilyMemberRepository familyMemberRepository;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final UserRepository userRepository;
    private final FamilyRepository familyRepository;

    private FamilyMember.Role mapRole(String role) {
        String normalizedRole = role.toUpperCase();
        if ("ADMIN".equals(normalizedRole)) {
            return FamilyMember.Role.ADMIN;
        } else if ("MEMBER".equals(normalizedRole) || "VIEWER".equals(normalizedRole)) {
            return FamilyMember.Role.MEMBER;
        } else {
            throw new CustomException("Role inválida");
        }
    }

    public List<FamilyMemberResponse> listFamilyMembers(Integer familyId, String token) {
        String jwtToken = token != null && token.startsWith("Bearer ") ? token.substring(7) : token;
        Integer userId = jwtService.extractUserId(jwtToken);

        boolean hasAccess = familyMemberRepository.existsByUserIdAndFamilyId(userId, familyId);
        if (!hasAccess) {
            throw new CustomException("Usuário não pertence à família especificada");
        }

        List<FamilyMember> members = familyMemberRepository.findByFamilyIdWithUserAndStatuses(
                familyId, 
                List.of(FamilyMember.Status.ACTIVE, FamilyMember.Status.PENDING)
        );
        return members.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public void inviteMember(Integer familyId, String inviterToken, InviteFamilyMemberRequest request) {
        String jwtToken = inviterToken != null && inviterToken.startsWith("Bearer ") ? inviterToken.substring(7) : inviterToken;
        Integer inviterId = jwtService.extractUserId(jwtToken);

        // Validate inviter is ADMIN
        if (!isAdmin(inviterId, familyId)) {
            throw new CustomException("Apenas administradores podem convidar membros");
        }

        // Check if user exists
        User userToInvite = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new CustomException("Usuário não está cadastrado na plataforma"));

        // Check if user is already a member
        if (familyMemberRepository.existsByUserIdAndFamilyId(userToInvite.getId(), familyId)) {
            throw new CustomException("Usuário já é membro desta família");
        }

        // Create FamilyMember with PENDING status
        Family family = familyRepository.findById(familyId)
                .orElseThrow(() -> new CustomException("Família não encontrada"));

        FamilyMember familyMember = new FamilyMember();
        familyMember.setFamily(family);
        familyMember.setUser(userToInvite);
        familyMember.setRole(mapRole(request.getRole()));
        familyMember.setStatus(FamilyMember.Status.PENDING);
        familyMember = familyMemberRepository.save(familyMember);

        // Generate invitation token
        String inviteToken = jwtService.generateFamilyInvitationToken(userToInvite.getEmail(), familyId);

        // Send invitation email
        User inviter = userRepository.findById(inviterId).orElseThrow();
        emailService.sendInvitationEmail(userToInvite.getEmail(), inviter.getUsername(), family.getName(), inviteToken);
    }

    @Transactional
    public void updateMemberRole(Integer familyId, Integer memberId, String requesterToken, UpdateMemberRoleRequest request) {
        String jwtToken = requesterToken != null && requesterToken.startsWith("Bearer ") ? requesterToken.substring(7) : requesterToken;
        Integer requesterId = jwtService.extractUserId(jwtToken);

        // Validate requester is ADMIN
        if (!isAdmin(requesterId, familyId)) {
            throw new CustomException("Apenas administradores podem atualizar roles");
        }

        // Get and update member
        FamilyMember member = familyMemberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException("Membro não encontrado"));

        if (!member.getFamily().getId().equals(familyId)) {
            throw new CustomException("Membro não pertence à família especificada");
        }

        // Check if demoting the last admin
        FamilyMember.Role newRole = mapRole(request.getRole());
        if (member.getRole() == FamilyMember.Role.ADMIN && newRole == FamilyMember.Role.MEMBER) {
            long adminCount = familyMemberRepository.countAdminsByFamilyId(familyId);
            if (adminCount <= 1) {
                throw new CustomException("Não é possível remover o único administrador");
            }
        }

        member.setRole(newRole);
        familyMemberRepository.save(member);
    }

    @Transactional
    public void removeMember(Integer familyId, Integer memberId, String requesterToken) {
        String jwtToken = requesterToken != null && requesterToken.startsWith("Bearer ") ? requesterToken.substring(7) : requesterToken;
        Integer requesterId = jwtService.extractUserId(jwtToken);

        // Validate requester is ADMIN
        if (!isAdmin(requesterId, familyId)) {
            throw new CustomException("Apenas administradores podem remover membros");
        }

        // Get member
        FamilyMember member = familyMemberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException("Membro não encontrado"));

        if (!member.getFamily().getId().equals(familyId)) {
            throw new CustomException("Membro não pertence à família especificada");
        }

        // Check if trying to remove oneself as the only admin
        if (member.getUser().getId().equals(requesterId)) {
            long adminCount = familyMemberRepository.countAdminsByFamilyId(familyId);
            if (adminCount <= 1) {
                throw new CustomException("Não é possível remover o único administrador");
            }
        }

        familyMemberRepository.delete(member);
    }

    @Transactional
    public void resendInvite(Integer familyId, Integer memberId, String requesterToken) {
        String jwtToken = requesterToken != null && requesterToken.startsWith("Bearer ") ? requesterToken.substring(7) : requesterToken;
        Integer requesterId = jwtService.extractUserId(jwtToken);

        // Validate requester is ADMIN
        if (!isAdmin(requesterId, familyId)) {
            throw new CustomException("Apenas administradores podem reenviar convites");
        }

        // Get member
        FamilyMember member = familyMemberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException("Membro não encontrado"));

        if (!member.getFamily().getId().equals(familyId)) {
            throw new CustomException("Membro não pertence à família especificada");
        }

        if (member.getStatus() != FamilyMember.Status.PENDING) {
            throw new CustomException("Apenas convites pendentes podem ser reenviados");
        }

        // Generate new invitation token
        String inviteToken = jwtService.generateFamilyInvitationToken(member.getUser().getEmail(), familyId);

        // Resend invitation email
        User inviter = userRepository.findById(requesterId).orElseThrow();
        emailService.sendInvitationEmail(member.getUser().getEmail(), inviter.getUsername(), member.getFamily().getName(), inviteToken);
    }

    public boolean isAdmin(Integer userId, Integer familyId) {
        return familyMemberRepository.findByUserIdAndFamilyIdAndRole(userId, familyId, FamilyMember.Role.ADMIN).isPresent();
    }

    private FamilyMemberResponse toResponse(FamilyMember member) {
        return FamilyMemberResponse.builder()
            .id(member.getId())
            .userId(member.getUser().getId())
            .username(member.getUser().getUsername())
            .email(member.getUser().getEmail())
            .avatarUrl(member.getUser().getAvatarUrl())
            .role(member.getRole().name())
            .status(member.getStatus().name())
            .build();
    }
}


