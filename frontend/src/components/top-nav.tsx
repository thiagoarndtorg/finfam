"use client";
import { ThemeToggle } from "./theme-toggle";
import { Notifications } from "./notifications";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSettings } from "@/contexts/settings-context";
import { useFamily } from "@/contexts/family-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ChevronDown } from "lucide-react";
import { getUserIdFromToken } from "@/lib/auth";

export function TopNav() {
  const { logout } = useAuth();
  const { familyId, userFamilies, switchFamily } = useFamily();
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter(Boolean);
  const { settings } = useSettings();
  
  // Get current user ID from JWT token
  const currentUserId = getUserIdFromToken() || 0;

  const currentFamily = userFamilies.find(f => f.id === familyId);
  const currentFamilyName = currentFamily 
    ? (currentFamily.createdBy === currentUserId ? "My Family" : currentFamily.name)
    : "Select Family";

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <nav className="flex items-center space-x-2">
              {pathSegments.map((segment, index) => (
                <React.Fragment key={segment}>
                  {index != 0 ? <span className="text-muted-foreground">/</span> : <span></span>}
                  <Link
                    href={`/${pathSegments.slice(0, index + 1).join("/")}`}
                    className="text-sm font-medium"
                  >
                    {segment.charAt(0).toUpperCase() + segment.slice(1)}
                  </Link>
                </React.Fragment>
              ))}
            </nav>
          </div>
          {userFamilies.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  {currentFamilyName}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Switch Family</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={familyId?.toString()} onValueChange={(value) => switchFamily(parseInt(value))}>
                  {userFamilies.map((family) => (
                    <DropdownMenuRadioItem key={family.id} value={family.id.toString()} className="cursor-pointer">
                      {family.createdBy === currentUserId ? "My Family" : family.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Notifications />
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={settings.avatar} alt={settings.fullName} />
                  <AvatarFallback>
                    {settings.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{settings.fullName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{settings.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
