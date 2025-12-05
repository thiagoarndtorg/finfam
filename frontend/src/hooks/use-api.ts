"use client";

import { useState, useCallback, useEffect } from "react";
import { apiClient, ApiError } from "@/middleware/api-client";
import { setAuthToken } from "@/lib/auth";
import { useSettings } from "@/contexts/settings-context";
import toast from "react-hot-toast";
import { AccountsResponse } from "@/types/account-type";
import { Transaction } from "@/types/transaction-type";
import { Notification } from "@/types/notification-type";
import { toastI18n } from "@/lib/toast-i18n";

// Define generic hook return type
interface ApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: ApiError | null;
}

interface ExecuteOptions {
  suppressToast?: boolean;
}

interface ApiHook<TData, TArgs extends any[]> extends ApiState<TData> {
  execute: (...args: TArgs | [...TArgs, ExecuteOptions]) => Promise<TData | null>;
  reset: () => void;
}

/**
 * Hook para fazer requisições à API com gerenciamento de estado
 */
export function useApi<TData, TArgs extends any[]>(
  apiMethod: (...args: TArgs) => Promise<TData>,
  immediate = false,
  initialArgs: TArgs = [] as unknown as TArgs
): ApiHook<TData, TArgs> {
  const [state, setState] = useState<ApiState<TData>>({
    data: null,
    isLoading: immediate,
    error: null,
  });

  const execute = useCallback(
    async (...args: TArgs | [...TArgs, ExecuteOptions]): Promise<TData | null> => {
      // Check if last argument is an options object
      const lastArg = args[args.length - 1];
      const options: ExecuteOptions | undefined =
        lastArg && typeof lastArg === 'object' && 'suppressToast' in lastArg
          ? (lastArg as ExecuteOptions)
          : undefined;

      // Extract actual API method arguments (excluding options)
      const methodArgs = options ? args.slice(0, -1) as TArgs : args as TArgs;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const data = await apiMethod(...methodArgs);
        setState({ data, isLoading: false, error: null });
        return data;
      } catch (error) {
        const apiError =
          error instanceof ApiError
            ? error
            : new ApiError(error instanceof Error ? error.message : "Unknown error", 500, null);

        setState({ data: null, isLoading: false, error: apiError });

        // 🔥 Show toast notification with the backend error message (unless suppressed)
        // The error message comes from CustomException in the backend
        if (!options?.suppressToast && apiError.message) {
          // Use the actual error message from the backend (from CustomException)
          toast.error(apiError.message, { id: `api-error-${Date.now()}` });
        }

        throw apiError;
      }
    },
    [apiMethod]
  );

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  // Run immediately if requested
  useEffect(() => {
    if (immediate) {
      execute(...initialArgs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}
/**
 * Hook para fazer login
 */
export function useLogin() {
  const { updateSettings } = useSettings();
  const apiMethod = useCallback(
    async (credentials: { email: string; password: string }) => {
      const res: any = await apiClient.post("/login", credentials);
      setAuthToken(res.token);

      updateSettings({
        fullName: res.username,
        email: res.email,
        avatar: res.avatar_url,
      });

      return res;
    },
    [updateSettings]
  );
  return useApi<{ token: string; user: any }, [{ email: string; password: string }]>(apiMethod);
}

/**
 * Hook para fazer registro
 */
export function useRegister() {
  const apiMethod = useCallback(
    (userData: { username: string; email: string; password: string; avatar_url: string }) =>
      apiClient.post("/register", userData).then(() => {
        // Registration successful, email verification sent
        return { success: true };
      }),
    []
  );
  return useApi<
    { success: boolean },
    [{ username: string; email: string; password: string; avatar_url: string }]
  >(apiMethod);
}

/**
 * Hook para fazer login com Google
 */
export function useGoogleAuth() {
  const { updateSettings } = useSettings();
  const apiMethod = useCallback(
    (googleData: { googleId: string; email: string; name: string; picture: string; idToken: string }) =>
      apiClient.post("/auth/google", googleData).then((res: any) => {
        setAuthToken(res.token);

        updateSettings({
          fullName: res.username,
          email: res.email,
          avatar: res.avatar_url,
        });
        return res;
      }),
    [updateSettings]
  );
  return useApi<
    { token: string; user: any },
    [{ googleId: string; email: string; name: string; picture: string; idToken: string }]
  >(apiMethod);
}

export function useBankConnect() {
  const apiMethod = useCallback(
    (userData: { username: string; email: string; password: string; avatar_url: string }) =>
      apiClient.post("/register", userData).then((res: any) => {
        setAuthToken(res.token);

        return res;
      }),
    []
  );
  return useApi<
    { token: string; user: any },
    [{ username: string; email: string; password: string; avatar_url: string }]
  >(apiMethod);
}

// New Hook for Connect Token
export function useConnectToken() {
  const apiMethod = useCallback(
    () =>
      apiClient.get("/connect-token").then((res: any) => {
        console.log("Connect token fetched:", res);
        return res; // Assuming res.data is the token string
      }),
    []
  );
  return useApi<string, []>(apiMethod);
}

// New Hook for Bank Statement
export function useBankStatement() {
  const apiMethod = useCallback(
    (itemId: string, familyId: number) =>
      apiClient.post("/bank-statement", { itemId: itemId, familyId: familyId }).then((res: any) => {
        console.log("Bank statement response:", res);

        return res; // { status, transactions }
      }),
    []
  );
  return useApi<{ status: string; transactions: any[] }, [string, number]>(apiMethod);
}

export function useFamilyFinancials() {
  const apiMethod = useCallback(
    (familyId: number) =>
      apiClient.get(`/family/${familyId}/financials`).then((res: any) => {
        console.log("Bank statement response:", res);

        return res; // { status, transactions }
      }),
    []
  );
  return useApi<AccountsResponse, [number]>(apiMethod);
}

// Hook para buscar contas da família
export function useFamilyAccounts() {
  const apiMethod = useCallback(
    (familyId: number) =>
      apiClient.get(`/family/${familyId}/accounts`).then((res: any) => {
        console.log("Family accounts response:", res);
        return res;
      }),
    []
  );
  return useApi<AccountsResponse, [number]>(apiMethod);
}

// Hook temporário para buscar contas usando o endpoint existente
export function useFamilyAccountsTemp() {
  const apiMethod = useCallback(
    (familyId: number) =>
      apiClient.get(`/family/${familyId}/financials`).then((res: any) => {
        console.log("Family financials response (temporary):", res);
        // Transformar a resposta para o formato esperado
        return {
          accounts: res?.accounts || [],
        };
      }),
    []
  );
  return useApi<AccountsResponse, [number]>(apiMethod);
}

// Hook para buscar categorias da família
export function useFamilyCategories() {
  const apiMethod = useCallback(
    (familyId: number) =>
      apiClient.get(`/categories?familyId=${familyId}`).then((res: any) => {
        console.log("Family categories response:", res);
        return res;
      }),
    []
  );
  return useApi<Array<{ id: number; name: string; icon: string; color: string; isIncome: boolean }>, [number]>(apiMethod);
}

// Hook para criar categoria
export function useCreateCategory() {
  const apiMethod = useCallback(
    (categoryData: { familyId: number; name: string; icon: string; color: string; isIncome: boolean }) =>
      apiClient.post("/categories", categoryData).then((res: any) => {
        console.log("Create category response:", res);
        return res;
      }),
    []
  );
  return useApi<{ id: number; name: string; icon: string; color: string; isIncome: boolean }, [{ familyId: number; name: string; icon: string; color: string; isIncome: boolean }]>(apiMethod);
}

// Hook para atualizar categoria
export function useUpdateCategory() {
  const apiMethod = useCallback(
    ({ id, familyId, ...categoryData }: { id: number; familyId: number; name: string; icon: string; color: string; isIncome: boolean }) =>
      apiClient.put(`/categories/${id}?familyId=${familyId}`, categoryData).then((res: any) => {
        console.log("Update category response:", res);
        return res;
      }),
    []
  );
  return useApi<{ id: number; name: string; icon: string; color: string; isIncome: boolean }, [{ id: number; familyId: number; name: string; icon: string; color: string; isIncome: boolean }]>(apiMethod);
}

// Hook para deletar categoria
export function useDeleteCategory() {
  const apiMethod = useCallback(
    ({ id, familyId }: { id: number; familyId: number }) =>
      apiClient.delete(`/categories/${id}?familyId=${familyId}`).then(() => {
        console.log("Delete category response: success");
        return undefined;
      }),
    []
  );
  return useApi<void, [{ id: number; familyId: number }]>(apiMethod);
}

// Hook para atualizar transação
export function useUpdateTransaction() {
  const apiMethod = useCallback(
    ({ id, familyId, ...updateData }: { id: number; familyId: number; categoryId?: number; amount?: number; description?: string; transactionDate?: string; transactionType?: string }) =>
      apiClient.put(`/transactions/${id}?familyId=${familyId}`, updateData).then((res: any) => {
        console.log("Update transaction response:", res);
        return res;
      }),
    []
  );
  return useApi<any, [{ id: number; familyId: number; categoryId?: number; amount?: number; description?: string; transactionDate?: string; transactionType?: string }]>(apiMethod);
}

// Hook para deletar transação
export function useDeleteTransaction() {
  const apiMethod = useCallback(
    ({ id, familyId }: { id: number; familyId: number }) =>
      apiClient.delete(`/transactions/${id}?familyId=${familyId}`).then(() => {
        console.log("Delete transaction response: success");
        return undefined;
      }),
    []
  );
  return useApi<void, [{ id: number; familyId: number }]>(apiMethod);
}

// Hook para desconectar conta
export function useDisconnectAccount() {
  const apiMethod = useCallback(
    ({ accountId, familyId }: { accountId: number; familyId: number }) =>
      apiClient.delete(`/accounts/${accountId}?familyId=${familyId}`).then(() => {
        console.log("Disconnect account response: success");
        return undefined;
      }),
    []
  );
  return useApi<void, [{ accountId: number; familyId: number }]>(apiMethod);
}

// Hook para desconectar todas as contas
export function useDisconnectAllAccounts() {
  const apiMethod = useCallback(
    ({ familyId }: { familyId: number }) =>
      apiClient.delete(`/accounts/disconnect-all?familyId=${familyId}`).then((res: any) => {
        console.log("Disconnect all accounts response:", res);
        return res;
      }),
    []
  );
  return useApi<{ count: number }, [{ familyId: number }]>(apiMethod);
}

// Hook para buscar transações por família
export function useFamilyTransactions() {
  const apiMethod = useCallback(
    (familyId: number) =>
      apiClient.get(`/transactions/family/${familyId}`).then((res: any) => {
        console.log("Family transactions response:", res);
        return res;
      }),
    []
  );
  return useApi<Array<Transaction>, [number]>(apiMethod);
}

// Hook para sincronização automática de contas
export function useAutoSyncAccounts() {
  const apiMethod = useCallback(
    ({ familyId }: { familyId: number }) =>
      apiClient.post("/auto-sync-accounts", { familyId }).then((res: any) => {
        console.log("Auto sync accounts response:", res);
        return res;
      }),
    []
  );
  return useApi<Array<{ itemId: string; bankEnum: string; balance: number; transactions: any[] }>, [{ familyId: number }]>(apiMethod);
}

// Hook para sincronização automática de contas (versão simplificada para refresh)
export function useAutoSyncAccountsSimple() {
  const apiMethod = useCallback(
    (familyId: number) =>
      apiClient.post("/auto-sync-accounts", { familyId }).then((res: any) => {
        console.log("Auto sync accounts response:", res);
        return res;
      }),
    []
  );
  return useApi<Array<{ itemId: string; bankEnum: string; balance: number; transactions: any[] }>, [number]>(apiMethod);
}

// Hook para sincronizar uma conta individual
export function useSyncAccount() {
  const apiMethod = useCallback(
    (accountId: number, familyId: number) =>
      apiClient.post(`/accounts/${accountId}/sync`, { familyId }).then((res: any) => {
        console.log("Sync account response:", res);
        return res;
      }),
    []
  );
  return useApi<{ itemId: string; bankEnum: string; balance: number; transactions: any[] }, [number, number]>(apiMethod);
}

// ==================== Budget Hooks ====================

export function useFamilyBudgets() {
  const apiMethod = useCallback(
    (familyId: number, year: number, month: number) =>
      apiClient.get(`/budgets?familyId=${familyId}&year=${year}&month=${month}`).then((res: any) => {
        console.log("Family budgets response:", res);
        return res;
      }),
    []
  );
  return useApi<Array<{ id: number; familyId: number; categoryId?: number; userId?: number; budgetType: string; year: number; month: number; amount: number; categoryName?: string; userName?: string }>, [number, number, number]>(apiMethod);
}

export function useSaveBudgets() {
  const apiMethod = useCallback(
    (bulkRequest: { familyId: number; year: number; month: number; budgets: Array<{ categoryId?: number; userId?: number; budgetType: string; amount: number }> }) =>
      apiClient.post("/budgets/bulk", bulkRequest).then((res: any) => {
        console.log("Save budgets response:", res);
        return res;
      }),
    []
  );
  return useApi<Array<any>, [{ familyId: number; year: number; month: number; budgets: Array<{ categoryId?: number; userId?: number; budgetType: string; amount: number }> }]>(apiMethod);
}

export function useDeleteBudget() {
  const apiMethod = useCallback(
    ({ id, familyId }: { id: number; familyId: number }) =>
      apiClient.delete(`/budgets/${id}?familyId=${familyId}`).then(() => {
        console.log("Delete budget response: success");
        return undefined;
      }),
    []
  );
  return useApi<void, [{ id: number; familyId: number }]>(apiMethod);
}

export function useFamilyNotifications() {
  const apiMethod = useCallback(
    (familyId: number) =>
      apiClient.get(`/notifications?familyId=${familyId}`).then((res: any) => {
        console.log("Family notifications response:", res);
        return res;
      }),
    []
  );
  return useApi<Array<Notification>, [number]>(apiMethod);
}

export function useDeleteNotification() {
  const apiMethod = useCallback(
    ({ id, familyId }: { id: number; familyId: number }) =>
      apiClient.delete(`/notifications/${id}?familyId=${familyId}`).then(() => {
        console.log("Delete notification response: success");
        return undefined;
      }),
    []
  );
  return useApi<void, [{ id: number; familyId: number }]>(apiMethod);
}

// ==================== Family Members Hooks ====================

export function useUserFamilies() {
  const apiMethod = useCallback(
    () =>
      apiClient.get("/user/families").then((res: any) => {
        console.log("User families response:", res);
        return res;
      }),
    []
  );
  return useApi<Array<{ id: number; name: string; createdBy: number }>, []>(apiMethod);
}

export function useFamilyMembers() {
  const apiMethod = useCallback(
    (familyId: number) =>
      apiClient.get(`/family/${familyId}/members`).then((res: any) => {
        console.log("Family members response:", res);
        return res;
      }),
    []
  );
  return useApi<Array<{ id: number; userId: number; username: string; email: string; avatarUrl: string; role: string; status: string }>, [number]>(apiMethod);
}

export function useInviteMember() {
  const apiMethod = useCallback(
    ({ familyId, email, role }: { familyId: number; email: string; role: string }) =>
      apiClient.post(`/family/${familyId}/members/invite`, { email, role }).then((res: any) => {
        console.log("Invite member response:", res);
        return res;
      }),
    []
  );
  return useApi<void, [{ familyId: number; email: string; role: string }]>(apiMethod);
}

export function useUpdateMemberRole() {
  const apiMethod = useCallback(
    ({ familyId, memberId, role }: { familyId: number; memberId: number; role: string }) =>
      apiClient.put(`/family/${familyId}/members/${memberId}/role`, { role }).then((res: any) => {
        console.log("Update member role response:", res);
        return res;
      }),
    []
  );
  return useApi<void, [{ familyId: number; memberId: number; role: string }]>(apiMethod);
}

export function useRemoveMember() {
  const apiMethod = useCallback(
    ({ familyId, memberId }: { familyId: number; memberId: number }) =>
      apiClient.delete(`/family/${familyId}/members/${memberId}`).then((res: any) => {
        console.log("Remove member response:", res);
        return res;
      }),
    []
  );
  return useApi<void, [{ familyId: number; memberId: number }]>(apiMethod);
}

export function useResendInvite() {
  const apiMethod = useCallback(
    ({ familyId, memberId }: { familyId: number; memberId: number }) =>
      apiClient.post(`/family/${familyId}/members/${memberId}/resend-invite`, {}).then((res: any) => {
        console.log("Resend invite response:", res);
        return res;
      }),
    []
  );
  return useApi<void, [{ familyId: number; memberId: number }]>(apiMethod);
}

export function useCurrentUserRole() {
  const apiMethod = useCallback(
    (familyId: number, userId: number) =>
      apiClient.get(`/family/${familyId}/members`).then((res: any) => {
        const currentMember = res.find((m: any) => m.userId === userId);
        return currentMember?.role || null;
      }),
    []
  );
  return useApi<string | null, [number, number]>(apiMethod);
}

export function useAcceptInvitation() {
  const apiMethod = useCallback(
    ({ token }: { token: string }) =>
      apiClient.post("/family/accept-invitation", { token }).then((res: any) => {
        console.log("Accept invitation response:", res);
        return res;
      }),
    []
  );
  return useApi<void, [{ token: string }]>(apiMethod);
}