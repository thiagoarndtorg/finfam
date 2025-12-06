"use client";

export const dynamic = "force-dynamic";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/auth-context";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useLogin, useGoogleAuth } from "@/hooks/use-api";
import { useI18n } from "@/contexts/i18n-context";
import { toastI18n } from "@/lib/toast-i18n";
import logoDark from "../../../../public/logo_finfam_dark.png";
import logoWhite from "../../../../public/logo_finfam_white.png";
import Image from "next/image";
import { useTheme } from "next-themes";
import toast from "react-hot-toast"
declare global {
  interface Window {
    google: any;
  }
}

function RegistrationToast() {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    if (searchParams.get("registered") === "true") {
     
      const timer = setTimeout(() => {
        toastI18n.info("auth.checkEmailVerification");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);
  
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { theme, setTheme } = useTheme()
  const { execute } = useLogin();
  const { execute: executeGoogleAuth } = useGoogleAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);


  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set in environment variables");
      return;
    }


    if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {

      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleSignIn,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleSignIn,
        });

        const buttonContainer = document.getElementById("google-signin-button");
        if (buttonContainer) {
          window.google.accounts.id.renderButton(buttonContainer, {
            theme: "outline",
            size: "large",
            width: "100%",
            text: "signin_with",
            locale: "pt-BR",
          });
        }
      }
    };
    script.onerror = () => {
      console.error("Failed to load Google Identity Services");
   
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleGoogleSignIn = async (response: any) => {
    setIsGoogleLoading(true);
    try {
   
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const userInfo = JSON.parse(jsonPayload);

      const result = await executeGoogleAuth({
        googleId: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        idToken: response.credential,
      });

      if (result != null) {
        router.push("/dashboard");
      }
    } catch (error: any) {
   
    } finally {
      setIsGoogleLoading(false);
    }
  };


  const loginSchema = z.object({
    email: z.string().email({ message: t("auth.invalidEmail") }),
    password: z.string().min(8, { message: t("auth.passwordMinLength") }),
    rememberMe: z.boolean().default(false),
  });

  type LoginFormValues = z.infer<typeof loginSchema>;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);

    try {
      const result = await execute({
        email: data.email,
        password: data.password,
      });

      console.log(result);

      if (result != null) {
        router.push("/dashboard");
      }
    } catch (error: any) {
    
      const errorMessage = error?.message || error?.data?.message || "";

 
      if (errorMessage) {
        toast.error(errorMessage, { id: `login-error-${Date.now()}` });
      } else {
       
        toastI18n.error("auth.invalidCredentials");
      }
    } finally {

      setIsLoading(false);
    }
  }

  return (
    <>
      <Suspense fallback={null}>
        <RegistrationToast />
      </Suspense>
      <div className="w-full max-w-md">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>

      <Card className="w-full">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <div className="h-12 w-12 rounded-full bg-transparent flex items-center justify-center">
              <div className="mt-[2px]">
                <Image src={theme === "dark" ? logoWhite : logoDark} alt=""></Image>
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">{t("auth.welcomeBack")}</CardTitle>
          <CardDescription className="text-center">
            {t("auth.enterCredentials")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.email")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("auth.emailPlaceholder")} type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.password")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="••••••••"
                          type={showPassword ? "text" : "password"}
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          <span className="sr-only">
                            {showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                          </span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row justify-between items-center space-x-2 space-y-0">
                    {/* <div className="flex gap-2 items-center">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">{t("auth.rememberMe")}</FormLabel>
                    </div> */}
                    {/* <div className="ml-auto">
                      <Link
                        href="/auth/forgot-password"
                        className="text-sm text-primary hover:underline"
                      >
                        {t("auth.forgotPassword")}
                      </Link>
                    </div> */}
                  </FormItem>
                )}
              />
              <div className="space-y-3">
                <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("common.loading")}
                    </>
                  ) : (
                    t("auth.login")
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      {t("auth.or")}
                    </span>
                  </div>
                </div>

                <div id="google-signin-button" className="hidden"></div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                 
                    const googleButton = document.querySelector('#google-signin-button iframe, #google-signin-button div[role="button"]') as HTMLElement;
                    if (googleButton) {
                      googleButton.click();
                    } else {
                    
                      const container = document.getElementById("google-signin-button");
                      if (container) {
                        const clickable = container.querySelector('div[role="button"], button, iframe') as HTMLElement;
                        if (clickable) {
                          clickable.click();
                        }
                      }
                    }
                  }}
                  disabled={isLoading || isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("common.loading")}
                    </>
                  ) : (
                    <>
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      {t("auth.loginWithGoogle")}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-sm text-muted-foreground">
            {t("auth.dontHaveAccount")}{" "}
            <Link href="/auth/register" className="text-primary font-medium hover:underline">
              {t("auth.createAccount")}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
    </>
  );
}
