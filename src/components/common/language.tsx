import { useEffect } from "react";
import type React from "react";
import i18next from "locales";
import useStorage from "context";
import Modal from "components/specific/modal";

const languages = [
  { id: "en", name: "English", flag: "🇬🇧" },
  { id: "tr", name: "Turkish", flag: "🇹🇷" },
  { id: "zh", name: "Chinese", flag: "🇨🇳" },
  { id: "es", name: "Spanish", flag: "🇪🇸" },
  { id: "hi", name: "Hindi", flag: "🇮🇳" },
  { id: "fa", name: "Persian", flag: "🇮🇷" },
  { id: "ar", name: "Arabic", flag: "🇸🇦" },
  { id: "bn", name: "Bengali", flag: "🇧🇩" },
  { id: "ru", name: "Russian", flag: "🇷🇺" },
  { id: "ja", name: "Japanese", flag: "🇯🇵" },
  { id: "de", name: "German", flag: "🇩🇪" },
  { id: "ko", name: "Korean", flag: "🇰🇷" },
  { id: "fr", name: "French", flag: "🇫🇷" },
  { id: "it", name: "Italian", flag: "🇮🇹" },
  { id: "pt", name: "Portuguese", flag: "🇵🇹" },
];

export default function Language() {
  const {
    setting: { lang = "en" },
  } = useStorage();
  const userLang = languages.find((e) => e.id === lang);
  return (
    <div className={"px-2 py-2"}>
      <Modal
        bodyClass="p-2"
        trigger={
          <div className="flex flex-col  justify-center items-center">
            <span className="text-3xl">{userLang?.flag}</span>
            {/* <span className="text-secondary text-xs -mt-2">
              {userLang?.name}
            </span> */}
          </div>
        }
      >
        <Languages close={() => null} />
      </Modal>
    </div>
  );
}
const Languages: React.FC<{
  close: () => void;
}> = ({ close }) => {
  const {
    setSetting,
    setting: { lang = "en" },
  } = useStorage();
  const changeLang = (value: any) => {
    close?.();
    setSetting({ lang: value.id });
  };
  return (
    <div
      className={
        "max-h-[400px] overflow-y-auto w-full grid grid-cols-3  text-black gap-2"
      }
    >
      {languages.map((langs) => (
        <div
          key={langs.id}
          onClick={() => changeLang(langs)}
          className={
            "flex flex-col cursor-default items-center bg-white/10 backdrop-blur-sm rounded-lg p-1 border border-black/5 hover:bg-black/10 " +
            (lang === langs.id ? "bg-black/10 " : "")
          }
        >
          <span className="text-3xl">{langs.flag}</span>
          <span className="text-sm">{langs.name}</span>
        </div>
      ))}
    </div>
  );
};

export function LangLoader() {
  const {
    setSetting,
    app: { user },
    setting,
  } = useStorage();

  useEffect(() => {
    const initialLang = setting.lang || "en";
    i18next.changeLanguage(initialLang);
    setSetting({ rand: Math.random() });
    updateHtmlLangDir(initialLang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, setting.lang]);

  const updateHtmlLangDir = (lang: string) => {
    const html = document.documentElement;
    html.setAttribute("lang", lang);
    html.setAttribute("dir", lang === "fa" || lang === "ar" ? "rtl" : "ltr");
  };

  return null;
}
