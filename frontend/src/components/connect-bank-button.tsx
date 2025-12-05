"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { BanknoteIcon as Bank, Loader2 } from "lucide-react";
import dynamic from "next/dynamic"; // Add this
import { useConnectToken, useBankStatement } from "@/hooks/use-api";
import { useI18n } from "@/contexts/i18n-context";
import { useFamily } from "@/contexts/family-context";
import { toast } from "sonner";

const PluggyConnect = dynamic(
  () => import("react-pluggy-connect").then((mod) => mod.PluggyConnect),
  { ssr: false }
);

export function ConnectBankButton() {
  const [showWidget, setShowWidget] = useState(false);
  const [itemId, setItemId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any>([]);
  const { t } = useI18n();
  const { familyId } = useFamily(); // Get familyId from context
  // API hook
  const connectTokenApi = useConnectToken();
  const bankStatement = useBankStatement();

  const handleFetchToken = async () => {
    console.log("Fetching connect token...");
    if (!connectTokenApi.data) {
      const token = await connectTokenApi.execute();
      console.log("Token fetched:", token);
      if (token) {
        setShowWidget(true);
        console.log("Show widget set to true");
      } else {
        console.log("No token returned");
        toast.error("Failed to fetch connect token");
      }
    } else {
      console.log("Using existing token:", connectTokenApi.data);
      setShowWidget(true);
    }
  };

  const handleConnectSuccess = async (data: any) => {
    console.log("Pluggy connection successful:", data);
    setItemId(data.item.id);
    setShowWidget(false);
    // Data is ready—handle it later wherever you need
    console.log("Item ID to process later:", data.item.id);
    await fetchTransactions(data.item.id);
  };

  const fetchTransactions = async (id: string) => {
    if (!familyId) {
      toast.error("Família não selecionada");
      return;
    }
    const data = await bankStatement.execute(id, familyId);
    setTransactions(data?.transactions);
  };

  const handleClose = () => {
    console.log("Closing widget...");
    setShowWidget(false);
    if (!itemId) {
      toast.info(t("toasts.info.bankCancelled"));
    }
  };
  return (
    <>
      <Button
        onClick={handleFetchToken}
        className="flex items-center gap-2"
        disabled={connectTokenApi.isLoading}
      >
        <Bank className="h-4 w-4" />
        <span>{connectTokenApi.isLoading ? "Loading..." : "Connect Bank"}</span>
      </Button>

      {showWidget && connectTokenApi.data && (
        <div className="py-4">
          <PluggyConnect
            connectToken={connectTokenApi.data}
            includeSandbox={true}
            onSuccess={handleConnectSuccess}
            onError={(error) => {
              console.error("Pluggy error:", error);
              toast.error(t("toasts.error.connectBank") + ": " + error.message);
              setShowWidget(false);
            }}
            onClose={handleClose}
            onOpen={() => console.log("Pluggy widget opened")}
          />
        </div>
      )}
    </>
  );
}
