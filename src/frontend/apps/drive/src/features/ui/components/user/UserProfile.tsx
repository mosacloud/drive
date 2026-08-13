import {
  DropdownMenu,
  Icon,
  IconSize,
  useDropdownMenu,
  UserMenu,
} from "@gouvfr-lasuite/ui-kit";
import { useAuth } from "@/features/auth/Auth";
import { logout } from "@/features/auth/Auth";
import {
  LanguagePickerUserMenu,
  LANGUAGES,
} from "@/features/layouts/components/header/Header";
import { LoginButton } from "@/features/auth/components/LoginButton";
import { Button } from "@gouvfr-lasuite/cunningham-react";
import { useTranslation } from "react-i18next";
import { useClipboard } from "@/hooks/useCopyToClipboard";
import { useEffect } from "react";

/**
 * The dropdown content of ui-kit's UserMenu is rendered through a react-aria
 * Popover, which portals its DOM node out from under any wrapper we render
 * here. CSS custom properties still inherit through portals via the real DOM
 * tree, so we set the picture on <html> instead of a local wrapper.
 *
 * The picture URL comes from the OIDC provider and isn't guaranteed to stay
 * reachable for the whole session (expired/session-scoped URL, network
 * error). We preload it and only flip on the CSS var once it actually
 * loads, so a failed load leaves the avatar's initials fallback visible
 * instead of an empty circle.
 */
const useProfilePictureVar = (picture?: string | null) => {
  useEffect(() => {
    const root = document.documentElement;
    const clear = () => {
      root.style.removeProperty("--user-profile-picture-url");
      delete root.dataset.hasProfilePicture;
    };

    if (!picture) {
      clear();
      return;
    }

    const image = new Image();
    image.onload = () => {
      const escaped = picture.replace(/["\\]/g, "\\$&");
      root.style.setProperty(
        "--user-profile-picture-url",
        `url("${escaped}")`
      );
      root.dataset.hasProfilePicture = "";
    };
    image.onerror = clear;
    image.src = picture;

    return () => {
      image.onload = null;
      image.onerror = null;
      clear();
    };
  }, [picture]);
};

export const UserProfile = () => {
  const { user } = useAuth();
  useProfilePictureVar(user?.picture);
  return (
    <div className="user-profile">
      {user ? (
        <UserMenu
          user={user}
          logout={logout}
          termOfServiceUrl="https://docs.numerique.gouv.fr/docs/8e298e03-c95f-44c7-be4a-ffb618af1854/"
          actions={<LanguagePickerUserMenu />}
        />
      ) : (
        <>
          <AnonymousDropdownMenu />
          <LoginButton />
        </>
      )}
    </div>
  );
};

const AnonymousDropdownMenu = () => {
  const { isOpen, setIsOpen } = useDropdownMenu();
  const { t, i18n } = useTranslation();
  const copyToClipboard = useClipboard();

  return (
    <DropdownMenu
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      options={[
        {
          icon: <Icon name="link" size={IconSize.SMALL} />,
          label: t("anonymous_dropdown_menu.copy_link"),
          callback: () => {
            copyToClipboard(window.location.href);
          },
        },
        {
          icon: <Icon name="language" size={IconSize.SMALL} />,
          label: t("anonymous_dropdown_menu.languages"),
          children: LANGUAGES.map((language) => ({
            label: language.label,
            callback: () => {
              i18n.changeLanguage(language.value);
            },
          })),
        },
      ]}
    >
      <Button
        icon={<Icon name="more_horiz" />}
        variant="tertiary"
        onClick={() => setIsOpen(!isOpen)}
        data-testid="anonymous-dropdown-menu"
      />
    </DropdownMenu>
  );
};
