"use client";

import { useFamilyFinancials, useUserFamilies, useCurrentUserRole, useFamilyMembers, useFamilyTransactions } from "@/hooks/use-api";
import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react";
import { Transaction } from "@/types/transaction-type";
import { AccountsResponse } from "@/types/account-type";
import { toastI18n } from "@/lib/toast-i18n";
import toast from "react-hot-toast";
import { apiClient } from "@/middleware/api-client";
import { ApiError } from "@/middleware/api-client";
import { getUserIdFromToken } from "@/lib/auth";

// Define the shape of your family data
type FamilyData = {
  id: number;
  // Add other properties as needed
};

type UserFamily = {
  id: number;
  name: string;
  createdBy: number;
};

type FamilyMember = {
  id: number;
  userId: number;
  username: string;
  email: string;
  avatarUrl: string;
  role: string;
  status: string;
};

// Define the context type
type FamilyContextType = {
  familyId: number;
  setFamilyId: (id: number) => void;
  userFamilies: UserFamily[];
  switchFamily: (newFamilyId: number) => void;
  familyData: AccountsResponse | null;
  setTransactions: (transactions: Transaction[]) => void;
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  categories: Array<{ id: number; name: string; icon: string; color: string; isIncome: boolean }>;
  setCategories: (categories: Array<{ id: number; name: string; icon: string; color: string; isIncome: boolean }>) => void;
  updateTransaction: (id: number, updates: Partial<Transaction>) => void;
  refreshFamilyData: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  selectedUserIds: number[];
  setSelectedUserIds: (ids: number[]) => void;
  selectedCategoryIds: number[];
  setSelectedCategoryIds: (ids: number[]) => void;
  familyMembers: FamilyMember[];
  setFamilyMembers: (members: FamilyMember[]) => void;
  refreshNotifications: () => void;
  notificationRefreshTrigger: number;
  currentUserRole: string | null;
  isCurrentUserAdmin: () => boolean;
};

// Create the context with default values
const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

// Provider component
export function FamilyProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [familyId, setFamilyId] = useState<number | null>(null);
  const [userFamilies, setUserFamilies] = useState<UserFamily[]>([]);
  const [familyData, setFamilyData] = useState<AccountsResponse | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Array<{ id: number; name: string; icon: string; color: string; isIncome: boolean }>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [notificationRefreshTrigger, setNotificationRefreshTrigger] = useState<number>(0);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const { execute: getUserFamilies } = useUserFamilies();
  const { execute: getCurrentUserRole } = useCurrentUserRole();
  const { execute: loadFamilyMembers } = useFamilyMembers();
  const { execute: loadFamilyTransactions } = useFamilyTransactions();

  // Compute filtered transactions based on selected users and categories
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Filter by user
      const matchesUser = selectedUserIds.length === 0 || selectedUserIds.includes(transaction.userId);

      // Filter by category
      const matchesCategory = selectedCategoryIds.length === 0 || (transaction.category && selectedCategoryIds.includes(transaction.category.id));

      // Apply both filters together (AND logic)
      return matchesUser && matchesCategory;
    });
  }, [transactions, selectedUserIds, selectedCategoryIds]);

  // Função para atualizar uma transação específica
  const updateTransaction = (id: number, updates: Partial<Transaction>) => {
    setTransactions(prev =>
      prev.map(t => t.id === id ? { ...t, ...updates } : t)
    );
  };

  const { execute } = useFamilyFinancials();

  // Função para trocar de família
  const switchFamily = (newFamilyId: number) => {
    setFamilyId(newFamilyId);
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedFamilyId", newFamilyId.toString());
    }

    // Reset all data for complete refresh
    setFamilyMembers([]);
    setTransactions([]);
    setCategories([]);
    setCurrentUserRole(null);

    // Refresh will happen automatically via useEffect when familyId changes
  };

  // Function to check if current user is admin
  const isCurrentUserAdmin = () => {
    return currentUserRole === 'ADMIN';
  };

  // Função para atualizar dados da família com auto-sync
  const refreshFamilyData = async () => {
    if (!familyId) {
      console.warn("No familyId available for refresh");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch updated family data
      const result = await execute(familyId);
      console.log("Refreshed family data:", result);
      setFamilyData(result);
    } catch (error) {
      setError(error instanceof Error ? error : new Error("Unknown error"));
      toastI18n.error("toasts.error.familyUpdate");
      console.error("Refresh family data error:", error);
      throw error; // Re-throw to let calling component handle it
    } finally {
      setIsLoading(false);
    }
  };

  // Function to refresh notifications
  const refreshNotifications = () => {
    setNotificationRefreshTrigger(prev => prev + 1);
  };

  // Load user's families on mount (only if authenticated)
  useEffect(() => {
    const loadUserFamilies = async () => {
      // Only try to load families if user is authenticated
      if (!apiClient.isAuthenticated()) {
        setIsLoading(false);
        return;
      }

      try {
        const families = await getUserFamilies({ suppressToast: true });
        if (families) {
          setUserFamilies(families);

          // Try to get saved familyId from localStorage
          const savedFamilyId = typeof window !== "undefined" ? localStorage.getItem("selectedFamilyId") : null;

          if (savedFamilyId && families.find(f => f.id === parseInt(savedFamilyId))) {
            setFamilyId(parseInt(savedFamilyId));
          } else if (families.length > 0) {
            // Use first family if no saved familyId
            setFamilyId(families[0].id);
          }
        }
      } catch (error) {
        // Handle 403 errors gracefully (user not authenticated or no access)
        if (error instanceof ApiError && error.status === 403) {
          console.log("User not authenticated or no access to families - this is expected on login page");
          setUserFamilies([]);
        } else {
          console.error("Error loading user families:", error);
        }
        setIsLoading(false);
      }
    };

    loadUserFamilies();
  }, [getUserFamilies]);

  useEffect(() => {
    const getFamilyFinancials = async () => {
      if (familyId == null) {
        return;
      }

      // Only fetch if user is authenticated
      if (!apiClient.isAuthenticated()) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Fetch family data
        const result = await execute(familyId, { suppressToast: true });
        console.log(result);
        if (result) {
          setFamilyData(result);
          console.log("Retrieved account data success:", result);
        } else {
          // No data is expected when no accounts exist yet
          setFamilyData({ accounts: [] } as AccountsResponse);
          console.log("No accounts found - this is normal for new users");
        }
      } catch (error) {
        // Handle 403 errors gracefully
        if (error instanceof ApiError && error.status === 403) {
          console.log("Access denied or no data available - setting empty state");
          setFamilyData({ accounts: [] } as AccountsResponse);
        } else {
          setError(error instanceof Error ? error : new Error("Unknown error"));
          toastI18n.error("toasts.error.accountInfo");
          console.error("Retrieved account data error:", error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    getFamilyFinancials();
  }, [familyId, execute]);

  // Load current user role when familyId changes
  useEffect(() => {
    const loadUserRole = async () => {
      if (familyId == null) {
        return;
      }

      if (!apiClient.isAuthenticated()) {
        return;
      }

      const userId = getUserIdFromToken();
      if (!userId) {
        return;
      }

      try {
        const role = await getCurrentUserRole(familyId, userId, { suppressToast: true });
        setCurrentUserRole(role);
      } catch (error) {
        console.error("Error loading user role:", error);
        setCurrentUserRole(null);
      }
    };

    loadUserRole();
  }, [familyId, getCurrentUserRole]);

  // Load family members when familyId changes
  useEffect(() => {
    const loadMembers = async () => {
      if (familyId == null) {
        return;
      }

      if (!apiClient.isAuthenticated()) {
        return;
      }

      try {
        const members = await loadFamilyMembers(familyId, { suppressToast: true });
        if (members) {
          setFamilyMembers(members);
        }
      } catch (error) {
        console.error("Error loading family members:", error);
        setFamilyMembers([]);
      }
    };

    loadMembers();
  }, [familyId, loadFamilyMembers]);

  // Load transactions when familyId changes
  useEffect(() => {
    const loadTransactions = async () => {
      if (familyId == null) {
        return;
      }

      if (!apiClient.isAuthenticated()) {
        return;
      }

      try {
        const transactionsData = await loadFamilyTransactions(familyId, { suppressToast: true });
        if (transactionsData) {
          setTransactions(transactionsData);
        }
      } catch (error) {
        console.error("Error loading transactions:", error);
        setTransactions([]);
      }
    };

    loadTransactions();
  }, [familyId, loadFamilyTransactions]);

  // Refresh budgets when familyId changes (trigger notification refresh)
  useEffect(() => {
    if (familyId == null) {
      return;
    }

    if (!apiClient.isAuthenticated()) {
      return;
    }

    // Trigger notification refresh when family changes
    refreshNotifications();
  }, [familyId]);

  return (
    <FamilyContext.Provider
      value={{
        familyId: familyId || 0,
        setFamilyId,
        userFamilies,
        switchFamily,
        familyData,
        isLoading,
        error,
        setTransactions,
        transactions,
        filteredTransactions,
        categories,
        setCategories,
        updateTransaction,
        refreshFamilyData,
        selectedUserIds,
        setSelectedUserIds,
        selectedCategoryIds,
        setSelectedCategoryIds,
        familyMembers,
        setFamilyMembers,
        refreshNotifications,
        notificationRefreshTrigger,
        currentUserRole,
        isCurrentUserAdmin
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
}


export function useFamily() {
  const context = useContext(FamilyContext);

  if (context === undefined) {
    throw new Error("useFamily must be used within a FamilyProvider");
  }

  return context;
}
