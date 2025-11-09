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
import { toast } from "sonner";

export default function SettingsPage() {
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    monthlyReports: true,
    weeklyReports: false,
    transactionAlerts: true,
    budgetAlerts: true,
  });

  const [privacySettings, setPrivacySettings] = useState({
    shareDataWithBanks: false,
    anonymousUsageData: true,
    showBalancesToFamily: true,
    showTransactionsToFamily: false,
  });

  const [openFinanceSettings, setOpenFinanceSettings] = useState({
    autoSync: true,
    syncFrequency: "daily",
    categorizeAutomatically: true,
    useAI: true,
  });

  const handleSaveNotifications = () => {
    toast.success("Notification settings saved successfully");
  };

  const handleSavePrivacy = () => {
    toast.success("Privacy settings saved successfully");
  };

  const handleSaveOpenFinance = () => {
    toast.success("Open Finance settings saved successfully");
  };

  const handleDisconnectAllBanks = () => {
    toast.success("All bank connections have been removed");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="open-finance">Open Finance</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications about your financial activity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notification Channels</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <Switch
                      id="email-notifications"
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          emailNotifications: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <Switch
                      id="push-notifications"
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          pushNotifications: checked,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Report Frequency</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="monthly-reports">Monthly Financial Reports</Label>
                    <Switch
                      id="monthly-reports"
                      checked={notificationSettings.monthlyReports}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          monthlyReports: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="weekly-reports">Weekly Spending Summaries</Label>
                    <Switch
                      id="weekly-reports"
                      checked={notificationSettings.weeklyReports}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, weeklyReports: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Alert Settings</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="transaction-alerts">Large Transaction Alerts</Label>
                    <Switch
                      id="transaction-alerts"
                      checked={notificationSettings.transactionAlerts}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          transactionAlerts: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="budget-alerts">Budget Threshold Alerts</Label>
                    <Switch
                      id="budget-alerts"
                      checked={notificationSettings.budgetAlerts}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, budgetAlerts: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications}>Save Notification Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Control how your financial data is shared and who can see it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Data Sharing</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="share-data-banks">Share Data with Connected Banks</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow banks to use your transaction data for personalized offers
                      </p>
                    </div>
                    <Switch
                      id="share-data-banks"
                      checked={privacySettings.shareDataWithBanks}
                      onCheckedChange={(checked) =>
                        setPrivacySettings({ ...privacySettings, shareDataWithBanks: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="anonymous-usage">Anonymous Usage Data</Label>
                      <p className="text-sm text-muted-foreground">
                        Share anonymous usage data to help improve our service
                      </p>
                    </div>
                    <Switch
                      id="anonymous-usage"
                      checked={privacySettings.anonymousUsageData}
                      onCheckedChange={(checked) =>
                        setPrivacySettings({ ...privacySettings, anonymousUsageData: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Family Visibility</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-balances">Show Account Balances to Family Members</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow family members to see your account balances
                      </p>
                    </div>
                    <Switch
                      id="show-balances"
                      checked={privacySettings.showBalancesToFamily}
                      onCheckedChange={(checked) =>
                        setPrivacySettings({ ...privacySettings, showBalancesToFamily: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-transactions">Show Transactions to Family Members</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow family members to see your individual transactions
                      </p>
                    </div>
                    <Switch
                      id="show-transactions"
                      checked={privacySettings.showTransactionsToFamily}
                      onCheckedChange={(checked) =>
                        setPrivacySettings({
                          ...privacySettings,
                          showTransactionsToFamily: checked,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSavePrivacy}>Save Privacy Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="open-finance">
          <Card>
            <CardHeader>
              <CardTitle>Open Finance Settings</CardTitle>
              <CardDescription>
                Configure how your financial data is synchronized and processed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Data Synchronization</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-sync">Automatic Synchronization</Label>
                    <Switch
                      id="auto-sync"
                      checked={openFinanceSettings.autoSync}
                      onCheckedChange={(checked) =>
                        setOpenFinanceSettings({ ...openFinanceSettings, autoSync: checked })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sync-frequency">Synchronization Frequency</Label>
                    <Select
                      value={openFinanceSettings.syncFrequency}
                      onValueChange={(value) =>
                        setOpenFinanceSettings({ ...openFinanceSettings, syncFrequency: value })
                      }
                    >
                      <SelectTrigger id="sync-frequency">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="manual">Manual Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Transaction Processing</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-categorize">Automatically Categorize Transactions</Label>
                    <Switch
                      id="auto-categorize"
                      checked={openFinanceSettings.categorizeAutomatically}
                      onCheckedChange={(checked) =>
                        setOpenFinanceSettings({
                          ...openFinanceSettings,
                          categorizeAutomatically: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="use-ai">Use AI for Categorization</Label>
                      <p className="text-sm text-muted-foreground">
                        Use artificial intelligence to improve transaction categorization
                      </p>
                    </div>
                    <Switch
                      id="use-ai"
                      checked={openFinanceSettings.useAI}
                      onCheckedChange={(checked) =>
                        setOpenFinanceSettings({ ...openFinanceSettings, useAI: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveOpenFinance}>Save Open Finance Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Manage your financial data and connected accounts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Connected Banks</h3>
                <div className="space-y-2 border rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-800 font-bold">N</span>
                      </div>
                      <div>
                        <p className="font-medium">Nubank</p>
                        <p className="text-sm text-muted-foreground">Connected on Jan 15, 2023</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Disconnect
                    </Button>
                  </div>

                  <Separator className="my-2" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-800 font-bold">I</span>
                      </div>
                      <div>
                        <p className="font-medium">Banco Inter</p>
                        <p className="text-sm text-muted-foreground">Connected on Feb 20, 2023</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Disconnect
                    </Button>
                  </div>

                  <Separator className="my-2" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-800 font-bold">I</span>
                      </div>
                      <div>
                        <p className="font-medium">Itaú</p>
                        <p className="text-sm text-muted-foreground">Connected on Mar 10, 2023</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Disconnect
                    </Button>
                  </div>
                </div>
                <Button variant="destructive" onClick={handleDisconnectAllBanks}>
                  Disconnect All Banks
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Data Export & Deletion</h3>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    You can export your financial data or request to delete all your data from our
                    servers.
                  </p>
                  <div className="flex gap-4">
                    <Button variant="outline">Export All Data</Button>
                    <Button variant="destructive">Delete All Data</Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Transaction History</h3>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Choose how long to keep your transaction history.
                  </p>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue placeholder="Select retention period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Keep all history</SelectItem>
                      <SelectItem value="1-year">Keep 1 year</SelectItem>
                      <SelectItem value="6-months">Keep 6 months</SelectItem>
                      <SelectItem value="3-months">Keep 3 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
