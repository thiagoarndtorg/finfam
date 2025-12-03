// Note: Make sure useFamilyFinancials() returns a stable execute function
// If it doesn't, wrap it with useCallback in that hook
"use client";

import { useState, useEffect } from "react";
import { useFamilyFinancials } from "./use-api";
import toast from "react-hot-toast";
import { AccountsResponse } from "@/types/account-type";
import { ApiError } from "@/middleware/api-client";

export type FamilyData = {
  // Define your family data type here
  id: number;
  // other properties
};

export function useFamilyData(initialFamilyId = 1) {
  const [familyId, setFamilyId] = useState<number>(initialFamilyId);
  const [familyData, setFamilyData] = useState<AccountsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const { execute } = useFamilyFinancials();

  useEffect(() => {
    let isMounted = true;

    const getFamilyFinancials = async () => {
      if (!isMounted) return;

      setIsLoading(true);
      setError(null);

      try {
        console.log("Attempting to fetch family financials for familyId:", familyId);
        const result = await execute(familyId, { suppressToast: true });

        if (isMounted) {
          if (result != null) {
            setFamilyData(result);
            console.log("Retrieved account data success:", result);
          } else {
            // No data is expected when no accounts exist yet - set empty state
            setFamilyData({ accounts: [] } as AccountsResponse);
            console.log("No accounts found - this is normal for new users");
          }
        }
      } catch (error) {
        if (isMounted) {
          // Check if it's a 403 error - might be expected when no accounts exist
          const is403Error = error instanceof ApiError && error.status === 403;
          
          // Only show error for non-403 errors
          if (!is403Error) {
            setError(error instanceof Error ? error : new Error("Unknown error"));
            toastI18n.error("toasts.error.accountInfo");
            console.error("Retrieved account data error:", error);
          } else {
            // For 403, just set empty state - might be expected when no accounts exist
            setFamilyData({ accounts: [] } as AccountsResponse);
            console.log("No data available (403) - setting empty state");
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    getFamilyFinancials();

    return () => {
      isMounted = false;
    };
  }, [familyId, execute]);

  return {
    familyId,
    setFamilyId,
    familyData,
    isLoading,
    error,
  };
}
