import { useTranslation } from "next-i18next";
import { useAuth } from "@/features/auth/Auth";
import { useEffect } from "react";
import {
  addToast,
  Toaster,
  ToasterItem,
} from "@/features/ui/components/toaster/Toaster";
import { SESSION_STORAGE_REDIRECT_AFTER_LOGIN_URL } from "@/features/api/fetchApi";
import { MosaLoginPage } from "@/features/home/components/MosaLoginPage";

export default function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Redirect to the attempted url if it exists, otherwise redirect to the last visited item.
  useEffect(() => {
    if (user) {
      const attemptedUrl = sessionStorage.getItem(
        SESSION_STORAGE_REDIRECT_AFTER_LOGIN_URL
      );
      if (attemptedUrl) {
        sessionStorage.removeItem(SESSION_STORAGE_REDIRECT_AFTER_LOGIN_URL);
        window.location.href = attemptedUrl;
      } else {
        window.location.href = `/explorer/items/${user.main_workspace.id}`;
      }
    }
  }, [user]);

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

  return (
    <>
      <MosaLoginPage />
      <Toaster />
    </>
  );
}
