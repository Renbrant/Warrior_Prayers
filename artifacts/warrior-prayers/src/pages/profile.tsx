import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useClerk } from "@clerk/react";
import {
  useGetMe,
  useUpdateMe,
  getGetMeQueryKey,
} from "@workspace/api-client-react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const profileSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  profilePhotoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  phone: z.string().optional(),
  churchName: z.string().optional(),
  city: z.string().optional(),
  preferredLanguage: z.enum(["en", "pt", "es"]),
});

type ProfileValues = z.infer<typeof profileSchema>;

function UserAvatar({ name, photoUrl }: { name: string | null | undefined; photoUrl: string | null | undefined }) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";
  if (photoUrl) {
    return <img src={photoUrl} alt={name ?? ""} className="w-20 h-20 rounded-full object-cover" />;
  }
  return (
    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
      {initials}
    </div>
  );
}

export default function Profile() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { signOut } = useClerk();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();

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
      preferredLanguage: "en",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        fullName: user.fullName ?? "",
        profilePhotoUrl: user.profilePhotoUrl ?? "",
        phone: user.phone ?? "",
        churchName: user.churchName ?? "",
        city: user.city ?? "",
        preferredLanguage: (user.preferredLanguage as "en" | "pt" | "es") ?? "en",
      });
    }
  }, [user, form]);

  const onSubmit = (data: ProfileValues) => {
    i18n.changeLanguage(data.preferredLanguage);
    localStorage.setItem("language", data.preferredLanguage);

    const payload = {
      fullName: data.fullName,
      profilePhotoUrl: data.profilePhotoUrl || undefined,
      phone: data.phone || undefined,
      churchName: data.churchName || undefined,
      city: data.city || undefined,
      preferredLanguage: data.preferredLanguage,
    };

    updateMe.mutate(
      { data: payload as Parameters<typeof updateMe.mutate>[0]["data"] },
      {
        onSuccess: (updated) => {
          queryClient.setQueryData(getGetMeQueryKey(), updated);
          toast({ title: "Profile saved", description: "Your changes have been saved." });
        },
        onError: () => {
          toast({ title: "Failed to save profile", variant: "destructive" });
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
            <User className="w-5 h-5 text-primary" /> Profile & Settings
          </h1>
          <p className="text-sm text-muted-foreground">Manage your account</p>
        </div>
      </header>

      <div className="flex flex-col items-center gap-3">
        <UserAvatar name={user?.fullName} photoUrl={user?.profilePhotoUrl} />
        <div className="text-center">
          <p className="font-bold text-foreground text-lg">{user?.fullName ?? "—"}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
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
                  <FormLabel className="text-foreground/80 font-medium">Full Name *</FormLabel>
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
                  <FormLabel className="text-foreground/80 font-medium">Profile Photo URL</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="url"
                      placeholder="https://example.com/photo.jpg (optional)"
                      className="bg-background rounded-2xl h-12 px-4"
                      data-testid="input-photo-url"
                    />
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
                  <FormLabel className="text-foreground/80 font-medium">Language</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background rounded-2xl h-12 px-4" data-testid="select-lang">
                        <SelectValue placeholder="Select language" />
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

            <div className="grid sm:grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80 font-medium">Phone</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="tel"
                        placeholder="Optional"
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
                    <FormLabel className="text-foreground/80 font-medium">City</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Optional"
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
                  <FormLabel className="text-foreground/80 font-medium">Church / Ministry</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Optional"
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
                {updateMe.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Account</h2>
        <div className="space-y-1 text-sm text-muted-foreground mb-4">
          <p><span className="text-foreground font-medium">Email:</span> {user?.email}</p>
          <p>
            <span className="text-foreground font-medium">Email verified:</span>{" "}
            {user?.emailVerified ? "Yes" : "No"}
          </p>
          <p>
            <span className="text-foreground font-medium">Member since:</span>{" "}
            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
          </p>
        </div>

        <div className="mb-6">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Connected Accounts</p>
          {user?.primaryAuthProvider ? (
            <div className="flex items-center gap-3 bg-background border border-border rounded-2xl px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold uppercase">
                {user.primaryAuthProvider.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground capitalize">{user.primaryAuthProvider}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <span className="text-xs text-green-500 font-semibold">Connected</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No auth provider linked.</p>
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
              {t("auth.logout")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>Sign out?</AlertDialogTitle>
              <AlertDialogDescription>
                You will be returned to the home page.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => signOut({ redirectUrl: "/" })}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                data-testid="btn-confirm-logout"
              >
                Sign Out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
