"use client";

import type React from "react";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
import { useAuth } from "@/contexts/auth-context";
import { Eye, EyeOff, Loader2, Camera, Upload, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { cn } from "@/lib/utils";
import logoDark from "../../../../public/logo_finfam_dark.png";
import logoWhite from "../../../../public/logo_finfam_white.png";
import { SettingsProvider, useSettings } from "@/contexts/settings-context";
import { useRegister } from "@/hooks/use-api";
import { useI18n } from "@/contexts/i18n-context";
import { useTheme } from "next-themes";

export default function RegisterPage() {
  const { theme, setTheme } = useTheme()

  const router = useRouter();
  const { t } = useI18n();
  const { register } = useAuth();
  const { updateSettings } = useSettings();
  const { execute } = useRegister();

  const registerSchema = z
    .object({
      name: z.string().min(2, { message: t("auth.nameMinLength") }),
      email: z.string().email({ message: t("auth.invalidEmail") }),
      password: z.string().min(8, { message: t("auth.passwordMinLength") }),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("auth.passwordsDoNotMatch"),
      path: ["confirmPassword"],
    });

  type RegisterFormValues = z.infer<typeof registerSchema>;
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  // Avatar state
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle avatar selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setAvatarError(null);

    if (file) {
      if (!file.type.startsWith("image/")) {
        setAvatarError(t("auth.selectValidImage"));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setAvatarError(t("auth.imageSizeLimit"));
        return;
      }

      setAvatar(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove avatar
  const handleRemoveAvatar = () => {
    setAvatar(null);
    setAvatarPreview(null);
    setAvatarError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Open file selector
  const handleSelectAvatar = () => {
    fileInputRef.current?.click();
  };

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    setError("");

    try {
      const result = await execute({
        username: data.name,
        email: data.email,
        password: data.password,
        avatar_url: "",
      });
      
      if (result != null) {
        // Redirect to login with success message
        router.push("/auth/login?registered=true");
      }
    } catch (error: any) {
      setError(error?.message || t("auth.registrationError"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
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
          <CardTitle className="text-2xl font-bold text-center">{t("auth.createAccountTitle")}</CardTitle>
          <CardDescription className="text-center">
            {t("auth.enterInformation")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Avatar upload section */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              {/* <div
                className={cn(
                  "w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer",
                  avatarPreview
                    ? "border-transparent"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                )}
                onClick={handleSelectAvatar}
              >
                {avatarPreview ? (
                  <Image
                    src={avatarPreview || "/placeholder.svg"}
                    alt="Avatar preview"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="h-8 w-8 text-muted-foreground/50" />
                )}
              </div> */}

              {/* {avatarPreview && (
                <button
                  type="button"
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                  onClick={handleRemoveAvatar}
                >
                  <X className="h-4 w-4" />
                </button>
              )} */}
            </div>

            {/* <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 text-xs flex items-center gap-1"
              onClick={handleSelectAvatar}
            >
              <Upload className="h-3 w-3" />
              {avatarPreview ? t("auth.changePhoto") : t("auth.addProfilePhoto")}
            </Button> */}

            {avatarError && <p className="text-xs text-destructive mt-1">{avatarError}</p>}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.fullName")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("auth.namePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                          placeholder={t("auth.passwordPlaceholder")}
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
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.confirmPassword")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder={t("auth.passwordPlaceholder")}
                          type={showConfirmPassword ? "text" : "password"}
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          <span className="sr-only">
                            {showConfirmPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                          </span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("auth.creatingAccount")}
                  </>
                ) : (
                  t("auth.createAccount")
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-sm text-muted-foreground">
            {t("auth.alreadyHaveAccount")}{" "}
            <Link href="/auth/login" className="text-primary font-medium hover:underline">
              {t("auth.signIn")}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
