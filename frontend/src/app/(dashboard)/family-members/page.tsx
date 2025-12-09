"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { UserPlus, MoreVertical, Edit, Trash2, Shield, ShieldAlert, Mail, Loader2 } from "lucide-react"
import { InviteMemberModal } from "@/components/invite-member-modal"
import { EditMemberModal } from "@/components/edit-member-modal"
import { DeleteMemberModal } from "@/components/delete-member-modal"
import { useFamily } from "@/contexts/family-context"
import { useFamilyMembers, useInviteMember, useUpdateMemberRole, useRemoveMember, useResendInvite, useLeaveFamily } from "@/hooks/use-api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useI18n } from "@/contexts/i18n-context"
import { getUserIdFromToken } from "@/lib/auth"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

export default function FamilyMembersPage() {
    const { t } = useI18n();
  const { familyId, userFamilies, switchFamily } = useFamily();
  const router = useRouter();
  const [members, setMembers] = useState([])
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [deletingMember, setDeletingMember] = useState(null)
  
  const { data: membersData, isLoading: isLoadingMembers, execute: loadMembers } = useFamilyMembers();
  const { execute: inviteMember } = useInviteMember();
  const { execute: updateMemberRole } = useUpdateMemberRole();
  const { execute: removeMember } = useRemoveMember();
  const { execute: resendInvite } = useResendInvite();
  const { execute: leaveFamily } = useLeaveFamily();

  // Get current user ID and check if they are the owner
  const currentUserId = getUserIdFromToken();
  const currentFamily = userFamilies.find(f => f.id === familyId);
  const isOwner = currentFamily?.createdBy === currentUserId;

  useEffect(() => {
    if (familyId && !isLoadingMembers) {
      loadMembers(familyId);
    }
  }, [familyId]);

  useEffect(() => {
    if (membersData) {
      setMembers(membersData);
    }
  }, [membersData]);

  const toBackendRole = (role) => {
    if (role === "member") return "MEMBER";
    if (role === "admin") return "ADMIN";
    return role.toUpperCase();
  }

  const handleInviteMember = async (newMember) => {
    try {
      await inviteMember({ familyId, email: newMember.email, role: toBackendRole(newMember.role) });
      setIsInviteModalOpen(false);
      loadMembers(familyId); // Reload members list
    } catch (error) {
      console.error("Error inviting member:", error);
    }
  }

  const handleEditMember = async (updatedMember) => {
    try {
      await updateMemberRole({ familyId, memberId: updatedMember.id, role: toBackendRole(updatedMember.role) });
      setEditingMember(null);
      loadMembers(familyId); // Reload members list
    } catch (error) {
      console.error("Error updating member:", error);
    }
  }

  const handleDeleteMember = async (id) => {
    try {
      await removeMember({ familyId, memberId: id });
      setDeletingMember(null);
      loadMembers(familyId); // Reload members list
    } catch (error) {
      console.error("Error removing member:", error);
    }
  }

  const handleResendInvite = async (id) => {
    try {
      await resendInvite({ familyId, memberId: id });
    } catch (error) {
      console.error("Error resending invite:", error);
    }
  }

  const handleLeaveFamily = async () => {
    if (!confirm(t("family.confirmLeave") || "Are you sure you want to leave this family? This action cannot be undone.")) {
      return;
    }

    try {
      await leaveFamily({ familyId });
      // Switch to another family or redirect to dashboard
      const otherFamilies = userFamilies.filter(f => f.id !== familyId);
      if (otherFamilies.length > 0) {
        switchFamily(otherFamilies[0].id);
      } else {
        router.push("/");
      }
    } catch (error: any) {
      console.error("Error leaving family:", error);
      alert(error.message || t("family.errorLeave") || "Error leaving family");
    }
  }

  const mapRole = (role) => {
    return role === "ADMIN" ? "admin" : "member";
  }

  if (isLoadingMembers) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">{t("family.members")}</h1>
        <div className="flex gap-2">
          {!isOwner && (
            <Button variant="outline" onClick={handleLeaveFamily}>
              <LogOut className="mr-2 h-4 w-4" />
              {t("family.leaveFamily") || "Leave Family"}
            </Button>
          )}
          <Button onClick={() => setIsInviteModalOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            {t("family.inviteMember")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("family.title")}</CardTitle>
          <CardDescription>
            {t("family.inviteDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <Alert>
              <AlertDescription>
                {t("family.noMembers")}
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.name")}</TableHead>
                  <TableHead>{t("common.email")}</TableHead>
                  <TableHead>{t("common.role")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead className="w-[100px]">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.filter(m => m.status === "ACTIVE" || m.status === "PENDING").map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.username}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {member.role === "ADMIN" ? (
                          <>
                            <ShieldAlert className="mr-2 h-4 w-4 text-primary" />
                            <span>{t("family.adminRole")}</span>
                          </>
                        ) : (
                          <>
                            <Shield className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{t("family.memberRole")}</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          member.status === "ACTIVE"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                        }`}
                      >
                        {member.status === "ACTIVE" ? t("common.active") : t("common.pending")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingMember({ ...member, role: mapRole(member.role) })}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>{t("common.edit")}</span>
                          </DropdownMenuItem>
                          {member.status === "PENDING" && (
                            <DropdownMenuItem onClick={() => handleResendInvite(member.id)}>
                              <Mail className="mr-2 h-4 w-4" />
                              <span>{t("family.resendInvite")}</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => setDeletingMember(member)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>{t("common.delete")}</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleInviteMember}
      />

      {editingMember && (
        <EditMemberModal
          isOpen={!!editingMember}
          onClose={() => setEditingMember(null)}
          member={editingMember}
          onSave={handleEditMember}
        />
      )}

      {deletingMember && (
        <DeleteMemberModal
          isOpen={!!deletingMember}
          onClose={() => setDeletingMember(null)}
          member={deletingMember}
          onDelete={handleDeleteMember}
        />
      )}
    </div>
  )
}
