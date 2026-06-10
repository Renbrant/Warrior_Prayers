import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/lib/queryClient";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import CompleteProfile from "@/pages/complete-profile";
import CreateGroup from "@/pages/create-group";
import GroupDashboard from "@/pages/group-dashboard";
import GroupMembers from "@/pages/group-members";
import GroupInvite from "@/pages/group-invite";
import GroupSettings from "@/pages/group-settings";
import MyInvitations from "@/pages/my-invitations";
import AcceptInvite from "@/pages/accept-invite";
import PrayerRequestList from "@/pages/prayer-request-list";
import CreatePrayerRequest from "@/pages/create-prayer-request";
import PrayerRequestDetail from "@/pages/prayer-request-detail";
import PrayerHistory from "@/pages/prayer-history";
import GroupCategories from "@/pages/group-categories";
import PrayerMode from "@/pages/prayer-mode";
import { AppShell } from "@/components/layout/app-shell";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

import "@/lib/i18n";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(27 75% 52%)",
    colorForeground: "hsl(210 40% 98%)",
    colorMutedForeground: "hsl(215 20.2% 65.1%)",
    colorDanger: "hsl(0 62.8% 30.6%)",
    colorBackground: "hsl(228 14% 10%)",
    colorInput: "hsl(228 14% 14%)",
    colorInputForeground: "hsl(210 40% 98%)",
    colorNeutral: "hsl(228 14% 14%)",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "1rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#171920] rounded-[2rem] w-[460px] max-w-full overflow-hidden border border-[#20232c] shadow-2xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#f8f9fa] font-extrabold",
    headerSubtitle: "text-[#94a3b8]",
    socialButtonsBlockButtonText: "text-[#f8f9fa] font-semibold",
    formFieldLabel: "text-[#f8f9fa] font-medium",
    footerActionLink: "text-[#e07b2a] hover:text-[#d97706] font-semibold",
    footerActionText: "text-[#94a3b8]",
    dividerText: "text-[#94a3b8]",
    identityPreviewEditButton: "text-[#e07b2a]",
    formFieldSuccessText: "text-green-500",
    alertText: "text-[#f8f9fa]",
    logoBox: "mb-8",
    logoImage: "w-12 h-12 mx-auto",
    socialButtonsBlockButton: "border-[#20232c] bg-[#20232c] hover:bg-[#20232c]/80 h-12 rounded-xl",
    formButtonPrimary: "bg-[#e07b2a] hover:bg-[#d97706] text-white font-bold h-12 rounded-full",
    formFieldInput: "bg-[#20232c] border-[#20232c] text-[#f8f9fa] focus:border-[#e07b2a] focus:ring-[#e07b2a] h-12 rounded-xl",
    footerAction: "bg-transparent mt-4",
    dividerLine: "bg-[#20232c]",
    alert: "bg-[#20232c] border-[#20232c] rounded-xl",
    otpCodeFieldInput: "bg-[#20232c] border-[#20232c] text-[#f8f9fa] h-12 rounded-xl",
    formFieldRow: "mb-5",
    main: "px-10 py-10",
  },
};

function AuthPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <div className="flex justify-end px-6 py-4">
        <LanguageSwitcher />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-12">
        {children}
      </div>
    </div>
  );
}

function SignInPage() {
  return (
    <AuthPageShell>
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </AuthPageShell>
  );
}

function SignUpPage() {
  return (
    <AuthPageShell>
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </AuthPageShell>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/app/dashboard" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function ProtectedAppShell() {
  return (
    <>
      <Show when="signed-in">
        <AppShell>
          <Switch>
            <Route path="/app/dashboard" component={Dashboard} />
            <Route path="/app/invitations" component={MyInvitations} />
            <Route path="/app/groups/create" component={CreateGroup} />
            <Route path="/app/groups/:groupId/settings" component={GroupSettings} />
            <Route path="/app/groups/:groupId/invite" component={GroupInvite} />
            <Route path="/app/groups/:groupId/members" component={GroupMembers} />
            <Route path="/app/groups/:groupId/categories" component={GroupCategories} />
            <Route path="/app/groups/:groupId/history" component={PrayerHistory} />
            <Route path="/app/groups/:groupId/requests/new" component={CreatePrayerRequest} />
            <Route path="/app/groups/:groupId/requests/:requestId" component={PrayerRequestDetail} />
            <Route path="/app/groups/:groupId/pray" component={PrayerMode} />
            <Route path="/app/groups/:groupId/requests" component={PrayerRequestList} />
            <Route path="/app/groups/:groupId" component={GroupDashboard} />
            <Route path="/app/groups">
              <Redirect to="/app/dashboard" />
            </Route>
            <Route path="/app/notifications">
              <Redirect to="/app/invitations" />
            </Route>
            <Route path="/app/profile">
              <Redirect to="/complete-profile" />
            </Route>
            <Route component={NotFound} />
          </Switch>
        </AppShell>
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/complete-profile">
            <Show when="signed-in">
              <CompleteProfile />
            </Show>
            <Show when="signed-out">
              <Redirect to="/" />
            </Show>
          </Route>
          <Route path="/invite/:token" component={AcceptInvite} />
          <Route path="/app/*" component={ProtectedAppShell} />
          <Route component={NotFound} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
