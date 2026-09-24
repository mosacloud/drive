import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/Auth";
import { getDriver } from "@/features/config/Config";
import { LANGUAGES } from "@/features/i18n/conf";

/**
 * Sync the browser/cookie-detected language (set on the anonymous login page,
 * or auto-detected for a brand new user) to the backend whenever the identity
 * provider hasn't confirmed a language of its own. Drive has no in-app
 * language picker once logged in — the login page is the only place a user
 * without a confirmed IdP locale can choose their language — so this has to
 * keep resyncing on every login, not just once for a freshly created user
 * with a still-null `language`, otherwise a returning user's fresh pick on
 * the login page is silently discarded by the effect below.
 */
export const useSyncUserLanguage = () => {
  const { user, refreshUser } = useAuth();
  const { i18n } = useTranslation();
  const driver = getDriver();
  // Tracks a frontend -> backend sync in flight so the backend -> frontend
  // effect below doesn't clobber the just-picked language with the stale
  // `user.language` while `updateUser` is still resolving — both effects run
  // in the same commit on first render after login. Only the `updateUser`
  // leg needs covering: once it resolves, the backend -> frontend effect
  // still can't fire on stale data because it depends on `user?.language`,
  // which only changes once the subsequent `refreshUser()` actually resolves.
  const pendingSyncRef = useRef(false);

  // Frontend -> Backend.
  useEffect(() => {
    if (!user || user.language_confirmed_by_idp) {
      pendingSyncRef.current = false;
      return;
    }

    // i18n.language is resolved against the languages we ship, so a browser
    // announcing "fr" reaches us as "fr-fr" and matches an entry below.
    const detectedLang = i18n.language;
    if (!detectedLang) {
      pendingSyncRef.current = false;
      return;
    }

    const language = LANGUAGES.find((lang) => lang.value === detectedLang);
    if (!language) {
      pendingSyncRef.current = false;
      return;
    }
    // Already synced to this value. Load-bearing, not just an optimization:
    // this effect depends on the whole `user` object, so any `refreshUser()`
    // call anywhere in the app (including our own below) produces a new
    // `user` reference and re-runs it — without this bail, that would
    // re-POST the same language and call `refreshUser()` again, looping.
    if (language.value === user.language) {
      pendingSyncRef.current = false;
      return;
    }

    pendingSyncRef.current = true;
    driver
      .updateUser({ language: language.value, id: user.id })
      .then(() => {
        pendingSyncRef.current = false;
        void refreshUser?.().catch((err) => {
          console.error("Language synced to backend but refreshing the local user failed", err);
        });
      })
      .catch((err) => {
        pendingSyncRef.current = false;
        console.error("Error syncing language to backend", err);
      });
  }, [user, i18n.language, driver, refreshUser]);

  // If user has a language, sync it to the browser. Reacts to user?.language
  // rather than just user?.id so a language that changes mid-session (e.g.
  // the identity provider confirms a locale on a later refreshUser() call)
  // is picked up too, not just on the first load after login.
  // Backend -> Frontend.
  useEffect(() => {
    if (!user) {
      return;
    }
    if (!user.language) {
      return;
    }
    if (pendingSyncRef.current) {
      return;
    }
    i18n.changeLanguage(user.language).catch((err) => {
      console.error(`Error changing language to "${user.language}"`, err);
    });
  }, [user?.language]);
};
