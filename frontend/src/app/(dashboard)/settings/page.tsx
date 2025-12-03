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
import { useI18n } from "@/contexts/i18n-context";
import { LanguageSelector } from "@/components/language-selector";

export default function SettingsPage() {
  const { t } = useI18n();
  const { familyId, familyData, refreshFamilyData } = useFamily();
  const { execute: disconnectAccount, isLoading: isDisconnecting } = useDisconnectAccount();
  const { execute: disconnectAllAccounts, isLoading: isDisconnectingAll } = useDisconnectAllAccounts();
  
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [disconnectAllDialogOpen, setDisconnectAllDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const activeAccounts = familyData?.accounts?.filter(account => account.isActive === true) || [];

  const formatDate = (dateString?: string) => {
    if (!dateString) return t("settings.unknownDate");
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
      toast.success(t("settings.accountDisconnected"));
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
      toast.success(t("settings.allAccountsDisconnected"));
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
      <h1 className="text-3xl font-bold tracking-tight">{t("settings.title")}</h1>

      <Tabs defaultValue="data" className="space-y-4">
        <TabsList>
          <TabsTrigger value="data">{t("settings.connectedAccounts")}</TabsTrigger>
        </TabsList>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.connectedAccounts")}</CardTitle>
              <CardDescription>{t("settings.connectedAccounts")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">{t("settings.connectedAccounts")}</h3>
                  <LanguageSelector />
                </div>
                {activeAccounts.length === 0 ? (
                  <div className="border rounded-md p-8 text-center">
                    <p className="text-muted-foreground">{t("settings.noAccountsConnected")}</p>
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
                              {t("settings.disconnectAccount")}
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
                      {t("settings.disconnectAllAccounts")}
                    </Button>
                  </>
                )}
              </div>

              <Dialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("settings.disconnectAccount")}</DialogTitle>
                    <DialogDescription>
                      {t("settings.disconnectConfirm")}
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
                      {t("common.cancel")}
                    </Button>
                    <Button variant="destructive" onClick={confirmDisconnect} disabled={isDisconnecting}>
                      {isDisconnecting ? t("common.loading") : t("settings.disconnectAccount")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={disconnectAllDialogOpen} onOpenChange={setDisconnectAllDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("settings.disconnectAllAccounts")}</DialogTitle>
                    <DialogDescription>
                      {t("settings.disconnectAllConfirm")}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setDisconnectAllDialogOpen(false)}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button variant="destructive" onClick={confirmDisconnectAll} disabled={isDisconnectingAll}>
                      {isDisconnectingAll ? t("common.loading") : t("settings.disconnectAllAccounts")}
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
