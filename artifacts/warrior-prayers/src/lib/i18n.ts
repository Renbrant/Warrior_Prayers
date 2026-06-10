import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "app.name": "Warrior Prayers",
      "app.subtitle": "Private prayer groups for care and intercession.",
      "auth.continueWithGoogle": "Continue with Google",
      "auth.continueWithEmail": "Continue with Email",
      "auth.createAccount": "Create Account",
      "auth.forgotPassword": "Forgot password?",
      "auth.signIn": "Sign In",
      "auth.logout": "Logout",
      "dashboard.welcome": "Welcome",
      "dashboard.noGroups": "You are not part of any prayer group yet. Create a group or accept an invitation to get started.",
      "groups.create": "Create Prayer Group",
      "settings.language": "Language",
      "landing.headline": "Organize private prayer groups with care, privacy, and purpose.",
      "landing.subheadline": "Create secure prayer groups, invite trusted people, share prayer requests, and walk together in intercession.",
      "landing.feature1.title": "Private Prayer Groups",
      "landing.feature1.desc": "Invite only the people you trust.",
      "landing.feature2.title": "Secure Prayer Requests",
      "landing.feature2.desc": "Share updates confidently.",
      "landing.feature3.title": "Pray Together",
      "landing.feature3.desc": "Commit to pray for each other.",
      "landing.feature4.title": "Answered Prayers",
      "landing.feature4.desc": "Keep track of God's faithfulness."
    }
  },
  pt: {
    translation: {
      "app.name": "Warrior Prayers",
      "app.subtitle": "Grupos de oração privados para cuidado e intercessão.",
      "auth.continueWithGoogle": "Continuar com o Google",
      "auth.continueWithEmail": "Continuar com o Email",
      "auth.createAccount": "Criar Conta",
      "auth.forgotPassword": "Esqueceu a senha?",
      "auth.signIn": "Entrar",
      "auth.logout": "Sair",
      "dashboard.welcome": "Bem-vindo",
      "dashboard.noGroups": "Você ainda não faz parte de nenhum grupo de oração. Crie um grupo ou aceite um convite para começar.",
      "groups.create": "Criar Grupo de Oração",
      "settings.language": "Idioma",
      "landing.headline": "Organize grupos de oração privados com cuidado, privacidade e propósito.",
      "landing.subheadline": "Crie grupos seguros, convide pessoas de confiança, compartilhe pedidos e caminhem juntos na intercessão.",
      "landing.feature1.title": "Grupos de Oração Privados",
      "landing.feature1.desc": "Convide apenas pessoas de confiança.",
      "landing.feature2.title": "Pedidos Seguros",
      "landing.feature2.desc": "Compartilhe atualizações com confiança.",
      "landing.feature3.title": "Orem Juntos",
      "landing.feature3.desc": "Comprometa-se a orar uns pelos outros.",
      "landing.feature4.title": "Orações Respondidas",
      "landing.feature4.desc": "Acompanhe a fidelidade de Deus."
    }
  },
  es: {
    translation: {
      "app.name": "Warrior Prayers",
      "app.subtitle": "Grupos de oración privados para cuidado e intercesión.",
      "auth.continueWithGoogle": "Continuar con Google",
      "auth.continueWithEmail": "Continuar con Correo",
      "auth.createAccount": "Crear Cuenta",
      "auth.forgotPassword": "¿Olvidaste tu contraseña?",
      "auth.signIn": "Iniciar Sesión",
      "auth.logout": "Cerrar Sesión",
      "dashboard.welcome": "Bienvenido",
      "dashboard.noGroups": "Aún no eres parte de ningún grupo de oración. Crea un grupo o acepta una invitación para empezar.",
      "groups.create": "Crear Grupo de Oración",
      "settings.language": "Idioma",
      "landing.headline": "Organiza grupos de oración privados con cuidado, privacidad y propósito.",
      "landing.subheadline": "Crea grupos seguros, invita a personas de confianza, comparte peticiones y caminen juntos en intercesión.",
      "landing.feature1.title": "Grupos de Oración Privados",
      "landing.feature1.desc": "Invita solo a quienes confías.",
      "landing.feature2.title": "Peticiones Seguras",
      "landing.feature2.desc": "Comparte actualizaciones con confianza.",
      "landing.feature3.title": "Oren Juntos",
      "landing.feature3.desc": "Comprométanse a orar unos por otros.",
      "landing.feature4.title": "Oraciones Contestadas",
      "landing.feature4.desc": "Lleva un registro de la fidelidad de Dios."
    }
  }
};

const savedLang = localStorage.getItem('language');
let defaultLang = 'en';

if (savedLang && ['en', 'pt', 'es'].includes(savedLang)) {
  defaultLang = savedLang;
} else {
  const browserLang = navigator.language.split('-')[0];
  if (['en', 'pt', 'es'].includes(browserLang)) {
    defaultLang = browserLang;
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;