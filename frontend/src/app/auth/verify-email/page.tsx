"use client";


import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useI18n } from "@/contexts/i18n-context";
import { apiClient } from "@/middleware/api-client";
import { toastI18n } from "@/lib/toast-i18n";
import Link from "next/link";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const hasVerified = useRef(false);

  useEffect(() => {

    if (hasVerified.current) {
      return;
    }

    const token = searchParams.get("token");


    if (!token) {

      setStatus("error");
      setErrorMessage(t("auth.invalidVerificationToken"));
      return;
    }

    const verifyEmail = async () => {
     
      hasVerified.current = true;

      try {
      
        const result = await apiClient.get<{ message: string }>(`/verify-email?token=${encodeURIComponent(token)}`);
      

     
        setStatus("success");
        toastI18n.success("auth.emailVerifiedSuccess");

      
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      } catch (error: any) {
      

       
        const errorStatus = error?.status;
        if (errorStatus && errorStatus >= 400) {
        
          const errorMsg = error?.message || error?.data?.message || "";
          if (errorMsg.includes("inválido") || errorMsg.includes("expirado")) {
         
         
            setStatus("success");
            toastI18n.success("auth.emailVerifiedSuccess");
            setTimeout(() => {
              router.push("/auth/login");
            }, 2000);
          } else {
          
            setStatus("error");
            setErrorMessage(errorMsg || t("auth.verificationError"));
            toastI18n.error("auth.verificationFailed");
          }
        } else {
        
          setStatus("success");
          toastI18n.success("auth.emailVerifiedSuccess");
          setTimeout(() => {
            router.push("/auth/login");
          }, 2000);
        }
      }
    };

    verifyEmail();
  }, [searchParams, router, t]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {t("auth.verifyEmail")}
          </CardTitle>
          <CardDescription>
            {status === "loading" && t("auth.verifyingEmail")}
            {status === "success" && t("auth.emailVerified")}
            {status === "error" && t("auth.verificationFailed")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          {status === "loading" && (
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          )}
          {status === "success" && (
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          )}
          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-sm text-destructive text-center">{errorMessage}</p>
            </>
          )}
        </CardContent>
        {status === "error" && (
          <CardFooter className="flex justify-center">
            <Button asChild variant="outline">
              <Link href="/auth/login">{t("auth.backToLogin")}</Link>
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  const { t } = useI18n();
  
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">
              {t("auth.verifyEmail")}
            </CardTitle>
            <CardDescription>
              {t("auth.verifyingEmail")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

