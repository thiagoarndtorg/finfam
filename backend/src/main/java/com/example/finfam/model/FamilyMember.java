package com.example.finfam.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "family_members", schema = "fin_fam_db")
@Data
public class FamilyMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "family_id", nullable = false)
    private Family family;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Role role = Role.MEMBER;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status = Status.ACTIVE;

    public enum Role {
        ADMIN, MEMBER
    }

    public enum Status {
        ACTIVE, INACTIVE, PENDING
    }
}
