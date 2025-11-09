import { useCallback } from "react";
import { useFamilyFinancials, useBankStatement } from "./use-api";
import { useFamily } from "@/contexts/family-context";
import { toast } from "sonner";

export function useDataRefresh() {
  const { familyId } = useFamily();
  const { execute: refreshFamilyFinancials } = useFamilyFinancials();
  const { execute: refreshBankStatement } = useBankStatement();

  const refreshAllData = useCallback(async () => {
    if (!familyId) {
      console.warn("No familyId available for data refresh");
      return;
    }

    try {
      console.log("Refreshing family financials...");
      await refreshFamilyFinancials(familyId);
      
      // Note: For bank statement refresh, we would need the itemId
      // This could be stored in context or passed as parameter
      // For now, we'll focus on family financials which includes transactions
      
      console.log("Data refresh completed successfully");
      toast.success("Data updated successfully");
    } catch (error) {
      console.error("Failed to refresh data:", error);
      toast.error("Failed to refresh data");
    }
  }, [familyId, refreshFamilyFinancials]);

  const refreshFamilyData = useCallback(async () => {
    if (!familyId) {
      console.warn("No familyId available for family data refresh");
      return;
    }

    try {
      console.log("Refreshing family financials...");
      await refreshFamilyFinancials(familyId);
      console.log("Family data refresh completed successfully");
    } catch (error) {
      console.error("Failed to refresh family data:", error);
      throw error; // Re-throw to let calling component handle it
    }
  }, [familyId, refreshFamilyFinancials]);

  const refreshBankData = useCallback(async (itemId: string) => {
    try {
      console.log("Refreshing bank statement...");
      await refreshBankStatement(itemId);
      console.log("Bank data refresh completed successfully");
    } catch (error) {
      console.error("Failed to refresh bank data:", error);
      throw error; // Re-throw to let calling component handle it
    }
  }, [refreshBankStatement]);

  return {
    refreshAllData,
    refreshFamilyData,
    refreshBankData,
  };
}
