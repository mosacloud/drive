import { useEffect, useState } from "react";
import { ReleaseNoteModal } from "@gouvfr-lasuite/ui-components";
import { useTranslation } from "react-i18next";

import { useConfig } from "@/features/config/ConfigProvider";

import { useReleaseNote } from "./useReleaseNote";

export const ReleaseNoteAuto = () => {
  const { config } = useConfig();
  const { t } = useTranslation();
  const enabled = config?.FRONTEND_RELEASE_NOTE_ENABLED;
  const [isOpen, setIsOpen] = useState(false);
  const { shouldShow, mainTitle, steps, markAsSeen } = useReleaseNote();

  useEffect(() => {
    if (shouldShow) {
      setIsOpen(true);
    }
  }, [shouldShow]);

  const handleClose = async () => {
    setIsOpen(false);
    await markAsSeen();
  };

  if (!enabled) {
    return null;
  }

  if (!shouldShow && !isOpen) {
    return null;
  }

  return (
    <ReleaseNoteModal
      isOpen={isOpen}
      appName={t("release_notes.labels.app_name")}
      mainTitle={mainTitle}
      steps={steps}
      // No "See what's new" link: upstream's points to La Suite's release notes
      // on docs.numerique.gouv.fr, and mosa.cloud has no such page.
      onClose={handleClose}
      onComplete={handleClose}
    />
  );
};
