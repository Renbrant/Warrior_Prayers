import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useGetMe, useUpdateMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useMemo } from "react";
import { useUser } from "@clerk/react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { User } from "lucide-react";

const profileSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  preferredLanguage: z.enum(["en", "pt", "es"]),
  phone: z.string().optional(),
  churchName: z.string().optional(),
  city: z.string().optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

export default function CompleteProfile() {
  const [, setLocation] = useLocation();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  const { user: clerkUser } = useUser();

  const { data: user, isLoading, isError } = useGetMe({
    query: { queryKey: getGetMeQueryKey() }
  });

  const updateMe = useUpdateMe();

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      preferredLanguage: (i18n.language as "en" | "pt" | "es") || "en",
      phone: "",
      churchName: "",
      city: "",
    },
  });

  useEffect(() => {
    if (user) {
      if (user.isProfileComplete) {
        setLocation("/app/dashboard");
      } else {
        const clerkFullName = clerkUser
          ? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ")
          : "";
        form.reset({
          fullName: user.fullName || clerkFullName,
          preferredLanguage: (user.preferredLanguage as "en" | "pt" | "es") || "en",
          phone: user.phone || "",
          churchName: user.churchName || "",
          city: user.city || "",
        });
      }
    }
  }, [user, clerkUser, form, setLocation]);

  const photoUrl = useMemo(
    () => user?.profilePhotoUrl || clerkUser?.imageUrl || null,
    [user?.profilePhotoUrl, clerkUser?.imageUrl]
  );

  const onSubmit = (data: ProfileValues) => {
    i18n.changeLanguage(data.preferredLanguage);
    localStorage.setItem("language", data.preferredLanguage);

    const payload: Parameters<typeof updateMe.mutate>[0]["data"] = {
      ...(data as Parameters<typeof updateMe.mutate>[0]["data"]),
      ...(!user?.profilePhotoUrl && photoUrl ? { profilePhotoUrl: photoUrl } : {}),
    };

    updateMe.mutate(
      { data: payload },
      {
        onSuccess: (updatedUser) => {
          queryClient.setQueryData(getGetMeQueryKey(), updatedUser);
          setLocation("/app/dashboard");
        },
      }
    );
  };

  useEffect(() => {
    if (isError) {
      setLocation("/");
    }
  }, [isError, setLocation]);

  if (isLoading) return <div className="min-h-screen bg-background" />;
  if (!user || isError) return null;

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-xl bg-card border border-border p-8 sm:p-12 rounded-[2.5rem] shadow-2xl">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center ring-2 ring-border">
              {photoUrl
                ? <img src={photoUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                : <User className="w-8 h-8 text-primary/60" />
              }
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground">{t("completeProfile.title")}</h1>
          <p className="text-muted-foreground mt-3 text-lg">{t("completeProfile.subtitle")}</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80 font-medium">{t("completeProfile.fullName")} *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="John Doe" className="bg-background rounded-2xl h-14 px-4 text-base" data-testid="input-fullname" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferredLanguage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80 font-medium">{t("completeProfile.language")} *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background rounded-2xl h-14 px-4 text-base" data-testid="select-lang">
                        <SelectValue placeholder={t("settings.language")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="pt">Português</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid sm:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80 font-medium">{t("completeProfile.phone")}</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" className="bg-background rounded-2xl h-14 px-4 text-base" data-testid="input-phone" />
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
                    <FormLabel className="text-foreground/80 font-medium">{t("completeProfile.city")}</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-background rounded-2xl h-14 px-4 text-base" data-testid="input-city" />
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
                  <FormLabel className="text-foreground/80 font-medium">{t("completeProfile.churchMinistry")}</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-background rounded-2xl h-14 px-4 text-base" data-testid="input-church" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4">
              <Button type="submit" className="w-full h-14 rounded-full text-base font-bold shadow-lg shadow-primary/20" disabled={updateMe.isPending} data-testid="btn-save-profile">
                {updateMe.isPending ? t("completeProfile.saving") : t("completeProfile.saveBtn")}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
