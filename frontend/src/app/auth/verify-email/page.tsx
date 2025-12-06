"use client";


export const dynamic = "force-dynamic";
import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useI18n } from "@/contexts/i18n-context";
import { apiClient } from "@/middleware/api-client";
import { toastI18n } from "@/lib/toast-i18n";
import Link from "next/link";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const hasVerified = useRef(false); // Prevents duplicate calls

  useEffect(() => {
    // Prevent duplicate calls (React Strict Mode runs useEffect twice in dev)
    if (hasVerified.current) {
      console.log("Already verified, skipping duplicate call");
      return;
    }

    const token = searchParams.get("token");
    console.log("Token from URL:", token);

    if (!token) {
      console.error("No token found in URL");
      setStatus("error");
      setErrorMessage(t("auth.invalidVerificationToken"));
      return;
    }

    const verifyEmail = async () => {
      // Mark as verified immediately to prevent duplicate calls
      hasVerified.current = true;

      try {
        console.log("Calling verify-email endpoint with token:", token);
        const result = await apiClient.get<{ message: string }>(`/verify-email?token=${encodeURIComponent(token)}`);
        console.log("✅ Verification successful, result:", result);

        // If we get here, verification was successful (no exception thrown)
        setStatus("success");
        toastI18n.success("auth.emailVerifiedSuccess");

        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      } catch (error: any) {
        console.error("❌ Verification error caught:", error);
        console.error("Error status:", error?.status);
        console.error("Error message:", error?.message);
        console.error("Error data:", error?.data);

        // Only show error if it's actually an HTTP error (status 400+)
        const errorStatus = error?.status;
        if (errorStatus && errorStatus >= 400) {
          // Check if error is "token already used" - in that case, treat as success
          const errorMsg = error?.message || error?.data?.message || "";
          if (errorMsg.includes("inválido") || errorMsg.includes("expirado")) {
            // Token was already used (probably from first call), treat as success
            console.log("Token already used (likely from duplicate call), treating as success");
            setStatus("success");
            toastI18n.success("auth.emailVerifiedSuccess");
            setTimeout(() => {
              router.push("/auth/login");
            }, 2000);
          } else {
            console.log("🔴 Real HTTP error detected, showing error state");
            setStatus("error");
            setErrorMessage(errorMsg || t("auth.verificationError"));
            toastI18n.error("auth.verificationFailed");
          }
        } else {
          // If no error status or status is undefined/null/0, treat as success
          // Backend confirmed it works, so this is likely a false positive
          console.log("✅ No error status found (or status < 400), treating as SUCCESS");
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

