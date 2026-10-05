import {
  DropdownMenu,
  Icon,
  IconSize,
  useDropdownMenu,
  Button,
} from "@gouvfr-lasuite/ui-components";
import { useAuth } from "@/features/auth/Auth";
import { logout } from "@/features/auth/Auth";
import { LANGUAGES } from "@/features/i18n/conf";
import { ProfileDropdownButton } from "@/features/ui/components/profile-dropdown/ProfileDropdown";
import { AnonymousCTA } from "../anonymous-cta/AnonymousCTA";
import { useTranslation } from "react-i18next";
import { useClipboard } from "@/hooks/useCopyToClipboard";

export const UserProfile = () => {
  const { user } = useAuth();
  return (
    <div className="user-profile">
      {user ? (
        <ProfileDropdownButton user={user} onLogout={logout} />
      ) : (
        <>
          <AnonymousDropdownMenu />
          <AnonymousCTA />
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
