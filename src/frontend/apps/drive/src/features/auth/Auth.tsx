import React, { PropsWithChildren, useCallback, useEffect, useState } from "react";

import { fetchAPI } from "@/features/api/fetchApi";
import { User } from "@/features/auth/types";
import { baseApiUrl } from "../api/utils";
import { APIError } from "../api/APIError";
import { posthog } from "posthog-js";
import { SpinnerPage } from "@/features/ui/components/spinner/SpinnerPage";
import { attemptSilentLogin, canAttemptSilentLogin } from "./silentLogin";
import { authUrl } from "./authUrl";
import { useConfig } from "../config/ConfigProvider";
import { LANGUAGE_LOCAL_STORAGE } from "@/features/i18n/conf";

export const logout = () => {
  // Drop the remembered interface language: it's shared by every visitor of
  // this browser, and an IdP-confirmed language gets written into it. Keeping
  // it would boot the next person on a shared machine into this user's
  // language. Storage can be unavailable (private mode, blocked cookies);
  // never let that stop the sign-out itself.
  try {
    localStorage.removeItem(LANGUAGE_LOCAL_STORAGE);
    document.cookie = "drive_language=; path=/; max-age=0";
  } catch (err) {
    console.warn("Could not clear stored language on logout", err);
  }
  window.location.replace(new URL("logout/", baseApiUrl()).href);
  posthog.reset();
};

export const login = (returnTo?: string) => {
  const url = authUrl({ returnTo });
  window.location.replace(url.href);
};

interface AuthContextInterface {
  user?: User | null;
  init?: () => Promise<User | null>;
  refreshUser?: () => Promise<void>;
}

export const AuthContext = React.createContext<AuthContextInterface>({});

export const useAuth = () => React.useContext(AuthContext);

export const Auth = ({
  children,
}: PropsWithChildren & { redirect?: boolean }) => {
  const [user, setUser] = useState<User | null>();
  const { config } = useConfig();

  // Stable identities: consumed by useSyncUserLanguage's effect dependency
  // arrays, where a new function on every render would re-fire those effects
  // (e.g. re-sending an already-in-flight language update) independently of
  // any actual user-state change.
  const init = useCallback(async () => {
    try {
      const response = await fetchAPI(`users/me/`, undefined, {
        redirectOn40x: false,
      });
      const data = (await response.json()) as User;
      setUser(data);
      return data;
    } catch (error) {
      if (config.FRONTEND_SILENT_LOGIN_ENABLED && error instanceof APIError && error.code === 401) {
        if (canAttemptSilentLogin()) {
          attemptSilentLogin(30);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      return null;
    }
  }, [config.FRONTEND_SILENT_LOGIN_ENABLED]);

  const refreshUser = useCallback(async () => {
    void init();
  }, [init]);

  useEffect(() => {
    void init();
  }, []);

  useEffect(() => {
    if (user) {
      posthog.identify(user.email, {
        email: user.email,
      });
    }
  }, [user]);

  if (user === undefined) {
    return <SpinnerPage />;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        init,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
