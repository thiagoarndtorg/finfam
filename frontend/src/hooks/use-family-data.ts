// Note: Make sure useFamilyFinancials() returns a stable execute function
// If it doesn't, wrap it with useCallback in that hook
"use client";

import { useState, useEffect } from "react";
import { useFamilyFinancials } from "./use-api";
import toast from "react-hot-toast";
import { AccountsResponse } from "@/types/account-type";

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
        const result = await execute(familyId);

        if (isMounted && result != null) {
          setFamilyData(result);
          console.log("Retrieved account data success:", result);
        } else {
          console.log("No data returned from API");
        }
      } catch (error) {
        if (isMounted) {
          setError(error instanceof Error ? error : new Error("Unknown error"));
          toast.error("Erro ao retornar informações da conta.");
          console.error("Retrieved account data error:", error);
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
  }, [familyId]);

  return {
    familyId,
    setFamilyId,
    familyData,
    isLoading,
    error,
  };
}
