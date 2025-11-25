"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useFamily } from "@/contexts/family-context";
import { useDisconnectAccount, useDisconnectAllAccounts } from "@/hooks/use-api";
import { Account } from "@/types/account-type";

export default function SettingsPage() {
  const { familyId, familyData, refreshFamilyData } = useFamily();
  const { execute: disconnectAccount, isLoading: isDisconnecting } = useDisconnectAccount();
  const { execute: disconnectAllAccounts, isLoading: isDisconnectingAll } = useDisconnectAllAccounts();
  
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [disconnectAllDialogOpen, setDisconnectAllDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const activeAccounts = familyData?.accounts?.filter(account => account.isActive === true) || [];

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown date";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
    } catch {
      return "Unknown date";
    }
  };

  const handleDisconnect = async (account: Account) => {
    setSelectedAccount(account);
    setDisconnectDialogOpen(true);
  };

  const confirmDisconnect = async () => {
    if (!selectedAccount || !familyId) return;

    const result = await disconnectAccount({ accountId: selectedAccount.id, familyId });
    if (result !== null) {
      toast.success("Bank disconnected successfully");
      await refreshFamilyData();
      setDisconnectDialogOpen(false);
      setSelectedAccount(null);
    }
  };

  const handleDisconnectAll = () => {
    setDisconnectAllDialogOpen(true);
  };

  const confirmDisconnectAll = async () => {
    if (!familyId) return;

    const result = await disconnectAllAccounts({ familyId });
    if (result !== null) {
      toast.success(`Successfully disconnected ${result.count} bank(s)`);
      await refreshFamilyData();
      setDisconnectAllDialogOpen(false);
    }
  };

  const getBankInitial = (bankName?: string) => {
    if (!bankName) return "?";
    return bankName.charAt(0).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <Tabs defaultValue="data" className="space-y-4">
        <TabsList>
          {/* <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="open-finance">Open Finance</TabsTrigger> */}
          <TabsTrigger value="data">Data Management</TabsTrigger>
        </TabsList>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Manage your financial data and connected accounts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Connected Banks</h3>
                {activeAccounts.length === 0 ? (
                  <div className="border rounded-md p-8 text-center">
                    <p className="text-muted-foreground">No banks connected yet</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 border rounded-md p-4">
                      {activeAccounts.map((account, index) => (
                        <div key={account.id}>
                          {index > 0 && <Separator className="my-2" />}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center"
                                style={{
                                  backgroundColor: account.color ? `${account.color}20` : "#f3f4f6",
                                  color: account.color || "#374151",
                                }}
                              >
                                <span className="font-bold text-sm">
                                  {getBankInitial(account.bank?.name)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium">{account.bank?.name || "Unknown Bank"}</p>
                                <p className="text-sm text-muted-foreground">
                                  Connected on {formatDate(account.createdAt)}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDisconnect(account)}
                              disabled={isDisconnecting}
                            >
                              Disconnect
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="destructive"
                      onClick={handleDisconnectAll}
                      disabled={isDisconnectingAll}
                    >
                      Disconnect All Banks
                    </Button>
                  </>
                )}
              </div>

              <Dialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Disconnect Bank</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to disconnect {selectedAccount?.bank?.name || "this bank"}? 
                      This will stop syncing data from this bank account.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDisconnectDialogOpen(false);
                        setSelectedAccount(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={confirmDisconnect} disabled={isDisconnecting}>
                      {isDisconnecting ? "Disconnecting..." : "Disconnect"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={disconnectAllDialogOpen} onOpenChange={setDisconnectAllDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Disconnect All Banks</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to disconnect all {activeAccounts.length} connected bank(s)? 
                      This will stop syncing data from all bank accounts.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setDisconnectAllDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={confirmDisconnectAll} disabled={isDisconnectingAll}>
                      {isDisconnectingAll ? "Disconnecting..." : "Disconnect All"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
