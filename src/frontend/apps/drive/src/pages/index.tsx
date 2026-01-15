import { useTranslation } from "next-i18next";
import { Auth, useAuth } from "@/features/auth/Auth";
import { useEffect, useState } from "react";
import {
  addToast,
  Toaster,
  ToasterItem,
} from "@/features/ui/components/toaster/Toaster";
import { MosaLoginPage } from "@/features/home/components/MosaLoginPage";
import { useConfig } from "@/features/config/ConfigProvider";
import { useRedirectAfterLogin } from "@/hooks/useRedirectAfterLogin";

export default function HomePage() {
  return (
    <Auth>
      <HomePageInner />
    </Auth>
  );
}

function HomePageInner() {
  const { t } = useTranslation();
  const { user } = useAuth();

  useRedirectAfterLogin();

  useEffect(() => {
    const failure = new URLSearchParams(window.location.search).get(
      "auth_error"
    );
    if (failure === "alpha") {
      addToast(
        <ToasterItem type="error">
          <span className="material-icons">science</span>
          <span>{t("authentication.error.alpha")}</span>
        </ToasterItem>
      );
    }
    if (failure === "user_cannot_access_app") {
      addToast(
        <ToasterItem type="error">
          <span className="material-icons">lock</span>
          <span>{t("authentication.error.user_cannot_access_app")}</span>
        </ToasterItem>
      );
    }
  }, [t]);

  if (user) {
    return null;
  }

  return <HomePageContent />;
}

/**
 * If the FRONTEND_EXTERNAL_HOME_URL is set, we redirect to it.
 * Otherwise, we display the home page.
 *
 * Redirection to FRONTEND_EXTERNAL_HOME_URL is done in this component
 * to avoid conflicts with the useEffect and redirection logic in the HomePage component.
 *
 * HomePage: if there is a user, redirect to the explorer.
 * HomePageContent: if the FRONTEND_EXTERNAL_HOME_URL is set, we redirect to it.
 *                  Otherwise, we display the home page.
 */
const HomePageContent = () => {
  const { config } = useConfig();
  const [redirectFailed, setRedirectFailed] = useState(false)

  useEffect(() => {
    const checkSiteAndRedirect = async () => {
      if (!config?.FRONTEND_EXTERNAL_HOME_URL) {
        return;
      }
      try {
        // Make sure the site is reachable before redirecting. Resilience.
        await fetch(config.FRONTEND_EXTERNAL_HOME_URL, {
          method: 'HEAD', // Use HEAD to avoid downloading the full page
          mode: 'no-cors', // Needed for cross-origin requests
        })
        window.location.replace(config.FRONTEND_EXTERNAL_HOME_URL)
      } catch (error) {
        console.warn('Site is not reachable:', error)
        setRedirectFailed(true)
      }
    }

    checkSiteAndRedirect()
  }, [config?.FRONTEND_EXTERNAL_HOME_URL])

  if (config?.FRONTEND_EXTERNAL_HOME_URL && !redirectFailed) {
    return null;
  }

  return (
    <>
      <MosaLoginPage />
      <Toaster />
    </>
  );
}
