import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./lang/en.json";
import zh from "./lang/zh.json";
import es from "./lang/es.json";
import hi from "./lang/hi.json";
import ar from "./lang/ar.json";
import pt from "./lang/pt.json";
import bn from "./lang/bn.json";
import ru from "./lang/ru.json";
import ja from "./lang/ja.json";
import de from "./lang/de.json";
import ko from "./lang/ko.json";
import fr from "./lang/fr.json";
import tr from "./lang/tr.json";
import it from "./lang/it.json";
import fa from "./lang/fa.json";

const resources = {
  en: {
    translation: en,
  },
  zh: {
    translation: zh,
  },
  es: {
    translation: es,
  },
  hi: {
    translation: hi,
  },
  ar: {
    translation: ar,
  },
  pt: {
    translation: pt,
  },
  bn: {
    translation: bn,
  },
  ru: {
    translation: ru,
  },
  ja: {
    translation: ja,
  },
  de: {
    translation: de,
  },
  ko: {
    translation: ko,
  },
  fr: {
    translation: fr,
  },
  tr: {
    translation: tr,
  },
  it: {
    translation: it,
  },
  fa: {
    translation: fa,
  },
};

i18next.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18next;
export const t = (...rest: any) => i18next.t(...rest);
