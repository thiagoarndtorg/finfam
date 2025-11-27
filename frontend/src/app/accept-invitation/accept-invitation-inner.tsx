"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAcceptInvitation } from "@/hooks/use-api";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function AcceptInvitationPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const token = searchParams.get("token");
  const { execute: acceptInvitation } = useAcceptInvitation();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const hasProcessed = useRef(false);

  const processInvitation = useCallback(async (invitationToken: string) => {
    hasProcessed.current = true;
    setStatus("loading");
    try {
      await acceptInvitation({ token: invitationToken });
      setStatus("success");

      setTimeout(() => {
        router.push(user ? "/" : "/auth/login");
      }, 2000);
    } catch (err: any) {
      setStatus("error");
      const statusCode = err?.status || err?.statusCode || err?.response?.status;
      const message = err?.message || "Erro ao aceitar o convite. Por favor, tente novamente.";

      if (statusCode === 400) {
        if (message.includes("expirado") || message.includes("expired") || message.includes("inválido")) {
          setErrorMessage("Este convite expirou ou é inválido.");
        } else if (message.includes("já foi aceito")) {
          setErrorMessage("Este convite já foi aceito. Faça login para continuar.");
        } else {
          setErrorMessage(message);
        }
      } else if (statusCode === 404) {
        if (message.includes("User not found")) {
          setErrorMessage("Usuário não encontrado.");
        } else if (message.includes("Invite not found")) {
          setErrorMessage("Convite não encontrado.");
        } else {
          setErrorMessage(message);
        }
      } else {
        setErrorMessage(message);
      }
    }
  }, [acceptInvitation, user, router]);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Token de convite não encontrado na URL");
      return;
    }

    processInvitation(token);
  }, [token, processInvitation]);

  const handleRetry = () => {
    if (token) {
      setErrorMessage("");
      setStatus("loading");
      processInvitation(token);
    }
  };

  const handleGoToLogin = () => {
    router.push("/auth/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Aceitar Convite</CardTitle>
          <CardDescription>Processando seu convite para a família</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Processando seu convite...</p>
            </div>
          )}

          {status === "success" && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 dark:text-green-200">Convite aceito!</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">Redirecionando...</AlertDescription>
            </Alert>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Erro ao aceitar convite</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
              <div className="flex gap-2">
                {token && (
                  <Button onClick={handleRetry} variant="outline" className="flex-1">
                    Tentar Novamente
                  </Button>
                )}
                <Button onClick={handleGoToLogin} className="flex-1">
                  Ir para Login
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
