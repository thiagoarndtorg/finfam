"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Users } from "lucide-react"
import { useFamily } from "@/contexts/family-context"
import { useFamilyMembers } from "@/hooks/use-api"

type FilterMember = {
  id: string;
  name: string;
  checked: boolean;
  isAdmin: boolean;
}

export function UserFilter() {
  const { familyId, familyMembers: contextMembers, selectedUserIds, setSelectedUserIds, setFamilyMembers } = useFamily();
  const { data: membersData, isLoading, execute: loadMembers } = useFamilyMembers();
  const [members, setMembers] = useState<FilterMember[]>([])

  // Load family members when component mounts or familyId changes
  useEffect(() => {
    if (familyId) {
      loadMembers(familyId);
    }
  }, [familyId, loadMembers]);

  // Update context family members when API data arrives
  useEffect(() => {
    if (membersData) {
      setFamilyMembers(membersData);
    }
  }, [membersData, setFamilyMembers]);

  // Transform API members to filter format and sync with selectedUserIds
  useEffect(() => {
    if (contextMembers.length > 0) {
      // Filter to show only active members
      const activeMembers = contextMembers.filter(m => m.status === "ACTIVE");
      
      const transformedMembers: FilterMember[] = activeMembers.map((member) => {
        const checked = selectedUserIds.length === 0 || selectedUserIds.includes(member.userId);
        return {
          id: String(member.userId),
          name: member.username,
          checked,
          isAdmin: member.role === "ADMIN"
        };
      });
      setMembers(transformedMembers);
    }
  }, [contextMembers, selectedUserIds]);

  const handleCheckedChange = (id: string, checked: boolean) => {
    const userId = Number(id);
    
    // Update local state for immediate UI feedback
    setMembers((prev) =>
      prev.map((member) => {
        if (member.id === id) {
          return { ...member, checked }
        }
        return member
      }),
    )
    
    // Update context
    if (selectedUserIds.length === 0) {
      // Currently showing all users
      if (checked) {
        // Do nothing, still showing all
      } else {
        // User is unchecking one, so show all except this one
        const allUserIds = members.map(m => Number(m.id));
        const newSelection = allUserIds.filter(uid => uid !== userId);
        setSelectedUserIds(newSelection);
      }
    } else {
      // Currently showing specific users
      if (checked) {
        // Add user to selection
        const newSelection = [...selectedUserIds, userId];
        setSelectedUserIds(newSelection);
      } else {
        // Remove user from selection
        const newSelection = selectedUserIds.filter(uid => uid !== userId);
        // If no users selected, show all (empty array means all)
        setSelectedUserIds(newSelection.length === 0 ? [] : newSelection);
      }
    }
  }

  const selectedCount = selectedUserIds.length === 0 
    ? members.filter((member) => member.checked).length 
    : selectedUserIds.length;
  const totalCount = members.length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>
            Users: {selectedCount}/{totalCount}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Family Members</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {members.map((member) => (
          <DropdownMenuCheckboxItem
            key={member.id}
            checked={member.checked}
            onCheckedChange={(checked) => handleCheckedChange(member.id, checked)}
          >
            {member.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

