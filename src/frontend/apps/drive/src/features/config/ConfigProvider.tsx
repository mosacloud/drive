import { Spinner } from "@gouvfr-lasuite/ui-kit";
import Head from "next/head";
import Script from "next/script";
import { useApiConfig } from "./useApiConfig";
import { ApiConfig } from "@/features/drivers/types";
import { createContext, useContext, useEffect } from "react";
import { useAppContext } from "@/pages/_app";

export interface ConfigContextType {
  config: ApiConfig;
}

// Theme names were renamed when upgrading cunningham-react/ui-kit
// (default→dsfr-light, anct→anct-light, dark→dsfr-dark). Deployments whose
// FRONTEND_THEME env var still uses an old name would resolve to a base theme
// that has no `components.favicon` override, crashing the whole app. Map the
// legacy names to their current equivalents so stale env vars keep working.
const LEGACY_THEME_ALIASES: Record<string, string> = {
  default: "dsfr-light",
  anct: "anct-light",
  dark: "dsfr-dark",
};

const resolveTheme = (theme?: string | null) => {
  if (!theme) {
    return "dsfr-light";
  }
  return LEGACY_THEME_ALIASES[theme] ?? theme;
};

export const ConfigContext = createContext<ConfigContextType | undefined>(
  undefined,
);

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
};

export const ConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: config } = useApiConfig();
  const { setTheme } = useAppContext();

  useEffect(() => {
    setTheme(resolveTheme(config?.FRONTEND_THEME));
  }, [config?.FRONTEND_THEME, setTheme]);

  if (!config) {
    return (
      <div className="global-loader">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <ConfigContext.Provider value={{ config }}>
      {config.FRONTEND_CSS_URL && (
        <Head>
          <link rel="stylesheet" href={config.FRONTEND_CSS_URL} />
        </Head>
      )}
      {config.FRONTEND_JS_URL && <Script src={config.FRONTEND_JS_URL} />}
      {children}
    </ConfigContext.Provider>
  );
};
