package com.example.finfam.service;

import com.example.finfam.dto.request.InviteFamilyMemberRequest;
import com.example.finfam.dto.request.UpdateMemberRoleRequest;
import com.example.finfam.dto.response.FamilyMemberResponse;
import com.example.finfam.exception.CustomException;
import com.example.finfam.model.Family;
import com.example.finfam.model.FamilyMember;
import com.example.finfam.model.User;
import com.example.finfam.model.Account;
import com.example.finfam.repository.FamilyMemberRepository;
import com.example.finfam.repository.FamilyRepository;
import com.example.finfam.repository.UserRepository;
import com.example.finfam.repository.AccountRepository;
import java.util.List;
import java.util.Optional;
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
    private final AccountRepository accountRepository;

    private FamilyMember.Role mapRole(String role) {
        if (role == null || role.trim().isEmpty()) {
            throw new CustomException("Role não pode ser vazia");
        }
        String normalizedRole = role.toUpperCase().trim();
        if ("ADMIN".equals(normalizedRole)) {
            return FamilyMember.Role.ADMIN;
        } else if ("MEMBER".equals(normalizedRole) || "VIEWER".equals(normalizedRole)) {
            return FamilyMember.Role.MEMBER;
        } else {
            throw new CustomException("Role inválida: " + role);
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
        try {
            if (request == null || request.getRole() == null || request.getRole().trim().isEmpty()) {
                throw new CustomException("Role é obrigatória");
            }
            
            String jwtToken = requesterToken != null && requesterToken.startsWith("Bearer ") ? requesterToken.substring(7) : requesterToken;
            Integer requesterId = jwtService.extractUserId(jwtToken);
            
            if (requesterId == null) {
                throw new CustomException("Token de autorização inválido");
            }

            // Validate requester is ADMIN
            if (!isAdmin(requesterId, familyId)) {
                throw new CustomException("Apenas administradores podem atualizar roles");
            }

            // Verify member belongs to the family first (avoids lazy loading issues)
            if (!familyMemberRepository.existsByIdAndFamilyId(memberId, familyId)) {
                throw new CustomException("Membro não pertence à família especificada");
            }

            // Get and update member
            FamilyMember member = familyMemberRepository.findById(memberId)
                    .orElseThrow(() -> new CustomException("Membro não encontrado"));

            // Get family to check if member is the creator
            Family family = familyRepository.findById(familyId)
                    .orElseThrow(() -> new CustomException("Família não encontrada"));
            
            // Check if trying to change role of the family creator (owner)
            // O criador da família sempre deve ser ADMIN e não pode ter seu role alterado
            Integer memberUserId = member.getUser().getId();
            if (family.getCreatedBy() != null && family.getCreatedBy().getId().equals(memberUserId)) {
                FamilyMember.Role newRole = mapRole(request.getRole());
                // Don't allow changing the owner's role from ADMIN
                if (newRole != FamilyMember.Role.ADMIN) {
                    throw new CustomException("O criador da família sempre deve ser administrador e não pode ter seu role alterado");
                }
                // If trying to set to ADMIN (which is already the case), just return success
                return;
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
        } catch (CustomException e) {
            throw e; // Re-throw CustomException as-is
        } catch (Exception e) {
            // Log the actual exception for debugging
            System.err.println("Error updating member role: " + e.getMessage());
            e.printStackTrace();
            throw new CustomException("Erro ao atualizar role do membro: " + e.getMessage());
        }
    }

    @Transactional
    public void removeMember(Integer familyId, Integer memberId, String requesterToken) {
        String jwtToken = requesterToken != null && requesterToken.startsWith("Bearer ") ? requesterToken.substring(7) : requesterToken;
        Integer requesterId = jwtService.extractUserId(jwtToken);
        
        if (requesterId == null) {
            throw new CustomException("Token de autorização inválido");
        }

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

        // Check if trying to remove the family creator (created_by)
        // O criador da família não pode ser removido por ninguém
        Integer memberUserId = member.getUser().getId();
        Family family = familyRepository.findById(familyId)
                .orElseThrow(() -> new CustomException("Família não encontrada"));
        if (family.getCreatedBy() != null && family.getCreatedBy().getId().equals(memberUserId)) {
            throw new CustomException("O criador da família não pode ser removido");
        }

        // Check if trying to remove oneself as the only admin
        if (member.getUser().getId().equals(requesterId)) {
            long adminCount = familyMemberRepository.countAdminsByFamilyId(familyId);
            if (adminCount <= 1) {
                throw new CustomException("Não é possível remover o único administrador");
            }
        }

        // Get user ID before deleting member
        Integer userIdToRemove = member.getUser().getId();

        // Delete all accounts of this user in this family
        // This will automatically delete all transactions due to CASCADE constraint
        List<Account> userAccounts = accountRepository.findByUserIdAndFamilyId(userIdToRemove, familyId);
        if (!userAccounts.isEmpty()) {
            accountRepository.deleteAll(userAccounts);
        }

        // Remove the family member
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

    @Transactional
    public void acceptInvitation(String invitationToken) {
        // Validate the invitation token
        if (!jwtService.validateFamilyInvitationToken(invitationToken)) {
            throw new CustomException("Token de convite inválido ou expirado", org.springframework.http.HttpStatus.BAD_REQUEST);
        }

        // Extract email and familyId from the token
        String email = jwtService.extractEmailFromInvitationToken(invitationToken);
        Integer familyId = jwtService.extractFamilyIdFromInvitationToken(invitationToken);

        if (email == null || familyId == null) {
            throw new CustomException("Token de convite inválido", org.springframework.http.HttpStatus.BAD_REQUEST);
        }

        // Find the user by email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("Usuário não encontrado", org.springframework.http.HttpStatus.NOT_FOUND));

        // Find the FamilyMember record
        FamilyMember member = familyMemberRepository.findByUserIdAndFamilyId(user.getId(), familyId)
                .orElseThrow(() -> new CustomException("Convite não encontrado", org.springframework.http.HttpStatus.NOT_FOUND));

        // Verify the member's current status is PENDING
        if (member.getStatus() != FamilyMember.Status.PENDING) {
            throw new CustomException("Convite já foi aceito ou não está mais pendente", org.springframework.http.HttpStatus.BAD_REQUEST);
        }

        // Update the status to ACTIVE
        member.setStatus(FamilyMember.Status.ACTIVE);
        familyMemberRepository.save(member);
    }

    @Transactional
    public void leaveFamily(Integer familyId, String token) {
        String jwtToken = token != null && token.startsWith("Bearer ") ? token.substring(7) : token;
        Integer userId = jwtService.extractUserId(jwtToken);

        // Get family to check if user is the owner
        Family family = familyRepository.findById(familyId)
                .orElseThrow(() -> new CustomException("Família não encontrada"));

        // Check if user is the owner (createdBy)
        if (family.getCreatedBy().getId().equals(userId)) {
            throw new CustomException("O criador da família não pode sair. Transfira a propriedade primeiro ou delete a família.");
        }

        // Get the member record
        FamilyMember member = familyMemberRepository.findByUserIdAndFamilyId(userId, familyId)
                .orElseThrow(() -> new CustomException("Você não é membro desta família"));

        // Check if trying to leave as the only admin
        if (member.getRole() == FamilyMember.Role.ADMIN) {
            long adminCount = familyMemberRepository.countAdminsByFamilyId(familyId);
            if (adminCount <= 1) {
                throw new CustomException("Não é possível sair sendo o único administrador. Promova outro membro a administrador primeiro.");
            }
        }

        // Delete all accounts of this user in this family
        // This will automatically delete all transactions due to CASCADE constraint
        List<Account> userAccounts = accountRepository.findByUserIdAndFamilyId(userId, familyId);
        if (!userAccounts.isEmpty()) {
            accountRepository.deleteAll(userAccounts);
        }

        // Remove the member
        familyMemberRepository.delete(member);
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


