import { LanguagePicker, useResponsive } from "@gouvfr-lasuite/ui-components";
import { useAuth } from "@/features/auth/Auth";
import { LANGUAGES } from "@/features/i18n/conf";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ExplorerSearchButton } from "@/features/explorer/components/app-view/ExplorerSearchButton";
import { Item } from "@/features/drivers/types";
import { ItemFilters } from "@/features/drivers/Driver";
import { useIsMinimalLayout } from "@/utils/useLayout";
import { Feedback } from "@/features/feedback/Feedback";
import { Gaufre } from "@/features/ui/components/gaufre/Gaufre";
import { AppSwitcherButton } from "@/features/ui/components/app-switcher/AppSwitcherPanel";
import { UserProfile } from "@/features/ui/components/user/UserProfile";

export const HeaderIcon = () => {
  return (
    <div className="drive__header__left">
      <div className="drive__header__logo" />
      <Feedback />
    </div>
  );
};

export const HeaderRight = ({
  displaySearch,
  currentItem,
}: {
  displaySearch?: boolean;
  currentItem?: Item;
}) => {
  const { user } = useAuth();

  const isMinimalLayout = useIsMinimalLayout();

  const { isTablet } = useResponsive();

  const defaultFilters: ItemFilters = useMemo(() => {
    const workspaceId = currentItem?.parents?.[0]?.id ?? currentItem?.id;

    if (isMinimalLayout) {
      return {
        workspace: workspaceId,
      };
    }
    return {};
  }, [currentItem, isMinimalLayout]);

  return (
    <>
      {user && displaySearch && (
        <ExplorerSearchButton defaultFilters={defaultFilters} />
      )}

      {!isTablet && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <AppSwitcherButton />
          <Gaufre />
          {/* Logged-in users manage their language via Epicentre/Hub, not
              in-app — but an anonymous visitor (e.g. viewing a shared item
              without an account) has no other way to set it, so this stays
              for them. */}
          {!user && <HeaderLanguagePicker />}
          <UserProfile />
        </div>
      )}
    </>
  );
};

export const HeaderLanguagePicker = () => {
  const { i18n } = useTranslation();
  const languages = useMemo(() => {
    return LANGUAGES.map((language) => ({
      ...language,
      isChecked: language.value === i18n.language,
    }));
  }, [i18n.language]);

  const onChange = (value: string) => {
    i18n.changeLanguage(value).catch((err) => {
      console.error("Error changing language", err);
    });
  };

  return (
    <LanguagePicker
      languages={languages}
      size="small"
      onChange={onChange}
      compact
    />
  );
};
