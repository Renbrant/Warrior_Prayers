import { useTranslation } from "react-i18next";
import { useAuth } from "@clerk/react";
import { useUpdateLanguage, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation();
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const updateLanguage = useUpdateLanguage();

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("language", lang);

    if (isSignedIn) {
      updateLanguage.mutate(
        { data: { language: lang as "en" | "pt" | "es" } },
        {
          onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          },
        },
      );
    }
  };

  return (
    <Select value={i18n.language} onValueChange={handleLanguageChange}>
      <SelectTrigger
        className={`w-[130px] bg-card border-border rounded-xl ${className ?? ""}`}
        data-testid="select-language"
      >
        <SelectValue placeholder={t("settings.language")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="pt">Português</SelectItem>
        <SelectItem value="es">Español</SelectItem>
      </SelectContent>
    </Select>
  );
}
