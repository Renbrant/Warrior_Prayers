import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Shield, Lock, Heart, CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (val: string) => {
    i18n.changeLanguage(val);
    localStorage.setItem("language", val);
  };

  const features = [
    { icon: Shield, title: t("landing.feature1.title"), desc: t("landing.feature1.desc") },
    { icon: Lock, title: t("landing.feature2.title"), desc: t("landing.feature2.desc") },
    { icon: Heart, title: t("landing.feature3.title"), desc: t("landing.feature3.desc") },
    { icon: CheckCircle2, title: t("landing.feature4.title"), desc: t("landing.feature4.desc") },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/30">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Warrior Prayers" className="w-8 h-8 object-contain" />
          <span className="font-bold text-lg hidden sm:inline-block">{t("app.name")}</span>
        </div>
        <div className="flex items-center gap-4">
          <Select value={i18n.language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[120px] bg-card border-border rounded-xl" data-testid="select-language">
              <SelectValue placeholder={t("settings.language")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="pt">Português</SelectItem>
              <SelectItem value="es">Español</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" asChild className="hidden sm:inline-flex rounded-xl font-semibold">
            <Link href="/sign-in" data-testid="link-signin">{t("auth.signIn")}</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="space-y-6">
            <div className="inline-flex items-center justify-center bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide border border-primary/20 mb-4">
              {t("app.subtitle")}
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              {t("landing.headline")}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t("landing.subheadline")}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Button size="lg" asChild className="w-full sm:w-auto text-base rounded-full h-14 px-8 font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
              <Link href="/sign-up" data-testid="btn-create-account">{t("auth.createAccount")}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto text-base rounded-full h-14 px-8 font-semibold border-border hover:bg-card">
              <Link href="/sign-in" data-testid="btn-signin">{t("auth.signIn")}</Link>
            </Button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-32 max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
          {features.map((feature, i) => (
            <div key={i} className="bg-card border border-border/60 p-8 rounded-3xl text-left hover:border-primary/50 transition-colors group">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-bold text-xl mb-3 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}