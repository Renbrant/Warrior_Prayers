import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetMe,
  useUpdateMe,
  getGetMeQueryKey,
} from "@workspace/api-client-react";
import { useClerk } from "@clerk/react";
import { ArrowLeft, LogOut, User, Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const profileSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  profilePhotoUrl: z.string().optional(),
  phone: z.string().optional(),
  churchName: z.string().optional(),
  city: z.string().optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();

  const { theme, toggleTheme } = useTheme();

  const [selectedLang, setSelectedLang] = useState<"en" | "pt" | "es">(
    () => {
      const saved = localStorage.getItem("language");
      return (saved === "en" || saved === "pt" || saved === "es") ? saved : "en";
    },
  );

  const { data: user, isLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey() },
  });

  const updateMe = useUpdateMe();

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      profilePhotoUrl: "",
      phone: "",
      churchName: "",
      city: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.setValue("fullName", user.fullName ?? "");
      form.setValue("profilePhotoUrl", user.profilePhotoUrl ?? "");
      form.setValue("phone", user.phone ?? "");
      form.setValue("churchName", user.churchName ?? "");
      form.setValue("city", user.city ?? "");
      const lang = user.preferredLanguage;
      if (lang === "en" || lang === "pt" || lang === "es") {
        setSelectedLang(lang);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onSubmit = (data: ProfileValues) => {
    i18n.changeLanguage(selectedLang);
    localStorage.setItem("language", selectedLang);

    const payload = {
      fullName: data.fullName,
      profilePhotoUrl: data.profilePhotoUrl || undefined,
      phone: data.phone || undefined,
      churchName: data.churchName || undefined,
      city: data.city || undefined,
      preferredLanguage: selectedLang,
    };

    updateMe.mutate(
      { data: payload as Parameters<typeof updateMe.mutate>[0]["data"] },
      {
        onSuccess: (updated) => {
          queryClient.setQueryData(getGetMeQueryKey(), updated);
          toast({ title: t("profile.saved") });
        },
        onError: () => {
          toast({ title: t("common.error"), variant: "destructive" });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 max-w-xl mx-auto space-y-8">
        <Skeleton className="h-8 w-36 rounded-xl" />
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="w-20 h-20 rounded-full" />
          <Skeleton className="h-5 w-48 rounded-md" />
        </div>
        <div className="space-y-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-xl mx-auto space-y-8">
      <header className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/app/dashboard")}
          className="rounded-full"
          data-testid="btn-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <User className="w-5 h-5 text-primary" /> {t("profile.title")}
          </h1>
        </div>
      </header>

      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
          {user?.profilePhotoUrl ? (
            <img src={user.profilePhotoUrl} alt={user?.fullName ?? ""} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-primary">
              {(user?.fullName ?? "?").slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        <div className="text-center">
          <p className="font-bold text-foreground text-lg">{user?.fullName ?? "—"}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80 font-medium">{t("profile.fullName")} *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="John Doe"
                      className="bg-background rounded-2xl h-12 px-4"
                      data-testid="input-fullname"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="profilePhotoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80 font-medium">{t("profile.photoUrl")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="url"
                      placeholder={t("profile.photoUrlPlaceholder")}
                      className="bg-background rounded-2xl h-12 px-4"
                      data-testid="input-photo-url"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">{t("profile.language")}</label>
              <Select
                value={selectedLang}
                onValueChange={(v) => setSelectedLang(v as "en" | "pt" | "es")}
              >
                <SelectTrigger
                  className="bg-background rounded-2xl h-12 px-4"
                  data-testid="select-lang"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="pt">Português</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">{t("profile.theme")}</label>
              <button
                type="button"
                onClick={toggleTheme}
                data-testid="theme-toggle"
                className="flex items-center gap-3 w-full bg-background border border-border rounded-2xl h-12 px-4 text-sm text-foreground hover:bg-muted transition-colors"
              >
                {theme === "dark"
                  ? <><Moon className="w-4 h-4 text-muted-foreground" /><span>{t("nav.darkMode")}</span></>
                  : <><Sun className="w-4 h-4 text-muted-foreground" /><span>{t("nav.lightMode")}</span></>
                }
                <span className="ml-auto text-xs text-muted-foreground">{t("profile.tapToSwitch")}</span>
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80 font-medium">{t("profile.phone")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="tel"
                        placeholder={t("common.optional")}
                        className="bg-background rounded-2xl h-12 px-4"
                        data-testid="input-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80 font-medium">{t("profile.city")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("common.optional")}
                        className="bg-background rounded-2xl h-12 px-4"
                        data-testid="input-city"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="churchName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80 font-medium">{t("profile.churchMinistry")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("common.optional")}
                      className="bg-background rounded-2xl h-12 px-4"
                      data-testid="input-church"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full h-12 rounded-full font-bold shadow-md shadow-primary/20"
                disabled={updateMe.isPending}
                data-testid="btn-save-profile"
              >
                {updateMe.isPending ? t("common.saving") : t("profile.saveChanges")}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6">
        <div className="mb-6">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {t("profile.connectedAccounts")}
          </p>
          {user?.primaryAuthProvider ? (
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground font-medium capitalize">{user.primaryAuthProvider}</p>
              </div>
              <span className="text-xs font-medium text-green-400">{t("common.connected")}</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("profile.noConnectedAccounts")}</p>
          )}
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full rounded-full border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive gap-2"
              data-testid="btn-logout"
            >
              <LogOut className="w-4 h-4" />
              {t("profile.signOut")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>{t("profile.signOutConfirm")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("profile.signOutDesc")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => signOut({ redirectUrl: "/" })}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                data-testid="btn-confirm-logout"
              >
                {t("profile.signOutBtn")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
