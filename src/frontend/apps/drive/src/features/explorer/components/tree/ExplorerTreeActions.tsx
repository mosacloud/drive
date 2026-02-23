import { DropdownMenu, useDropdownMenu } from "@gouvfr-lasuite/ui-kit";
import { useGlobalExplorer } from "@/features/explorer/components/GlobalExplorerContext";
import { Button } from "@gouvfr-lasuite/cunningham-react";
import { useTranslation } from "react-i18next";
import { ExplorerSearchButton } from "@/features/explorer/components/app-view/ExplorerSearchButton";
import { useCreateMenuItems } from "../../hooks/useCreateMenuItems";

export const ExplorerTreeActions = () => {
  const { t } = useTranslation();
  const { treeIsInitialized } = useGlobalExplorer();

  const createMenu = useDropdownMenu();

  const { menuItems, modals } = useCreateMenuItems();

  if (!treeIsInitialized) {
    return null;
  }
  return (
    <>
      <div className="explorer__tree__actions">
        <div className="explorer__tree__actions__left">
          <DropdownMenu
            options={menuItems}
            {...createMenu}
            onOpenChange={createMenu.setIsOpen}
          >
            <Button
              icon={<span className="material-icons">add</span>}
              onClick={() => createMenu.setIsOpen(true)}
            >
              {t("explorer.tree.create.label")}
            </Button>
          </DropdownMenu>
        </div>
        <ExplorerSearchButton keyboardShortcut />
      </div>
      {modals}
    </>
  );
};
