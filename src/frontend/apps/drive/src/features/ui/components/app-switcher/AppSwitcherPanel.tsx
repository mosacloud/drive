import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@gouvfr-lasuite/cunningham-react";
import { useConfig } from "@/features/config/ConfigProvider";

type AppId =
  | "epicentre"
  | "docs"
  | "drive"
  | "meet"
  | "mail"
  | "calendar"
  | "chat"
  | "commander";

const APP_META: Record<
  AppId,
  {
    icon: string;
    label: string;
    subtitle: string;
    color: string;
    gradientEnd: string;
  }
> = {
  epicentre: {
    icon: "/images/icons/epicentre-icon.svg",
    label: "Epicentre",
    subtitle: "Home",
    color: "#0284C7",
    gradientEnd: "#0443F2",
  },
  docs: {
    icon: "/images/icons/file-icon.svg",
    label: "Docs",
    subtitle: "Documents",
    color: "#06B6D4",
    gradientEnd: "#0891B2",
  },
  drive: {
    icon: "/images/icons/folder-icon.svg",
    label: "Drive",
    subtitle: "Files",
    color: "#F2AF05",
    gradientEnd: "#D97706",
  },
  meet: {
    icon: "/images/icons/camera-icon.svg",
    label: "Meet",
    subtitle: "Video calls",
    color: "#00B574",
    gradientEnd: "#059669",
  },
  mail: {
    icon: "/images/icons/mail-icon.svg",
    label: "Mail",
    subtitle: "Email",
    color: "#F8497B",
    gradientEnd: "#A0033A",
  },
  calendar: {
    icon: "/images/icons/calendar-icon.svg",
    label: "Calendar",
    subtitle: "Schedule",
    color: "#A78BFA",
    gradientEnd: "#6D3FDE",
  },
  chat: {
    icon: "/images/icons/chat-icon.svg",
    label: "Chat",
    subtitle: "Messaging",
    color: "#FA7108",
    gradientEnd: "#C2410C",
  },
  commander: {
    icon: "/images/icons/commander-icon.svg",
    label: "Commander",
    subtitle: "Admin",
    color: "#0284C7",
    gradientEnd: "#0064C8",
  },
};

const APP_ORDER: AppId[] = [
  "epicentre",
  "docs",
  "meet",
  "mail",
  "calendar",
  "chat",
  "commander",
];

const AppIcon = ({ id, size = 40 }: { id: AppId; size?: number }) => {
  const { icon, label, color, gradientEnd } = APP_META[id];
  const radius = size <= 36 ? 9 : 12;
  return (
    <span
      className="app-switcher-panel__icon"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: `linear-gradient(135deg, ${color} 0%, ${gradientEnd} 100%)`,
      }}
    >
      <img
        src={icon}
        alt={label}
        style={{ width: size * 0.45, height: size * 0.45 }}
      />
    </span>
  );
};

const Panel = ({
  onClose,
  opensUpward,
  appUrls,
}: {
  onClose: () => void;
  opensUpward: boolean;
  appUrls: Record<string, string>;
}) => {
  const { t } = useTranslation();

  const jumpTo = APP_ORDER.filter(
    (id) => id in appUrls && id in APP_META,
  );

  return (
    <div
      className={`app-switcher-panel__dropdown${opensUpward ? " app-switcher-panel__dropdown--up" : ""}`}
      style={{
        background: `linear-gradient(180deg, color-mix(in srgb, ${APP_META.drive.color} 8%, transparent) 0%, transparent 100%) top center / 100% 80px no-repeat, #ffffff`,
      }}
    >
      <div className="app-switcher-panel__current">
        <AppIcon id="drive" size={44} />
        <div className="app-switcher-panel__current-text">
          <span className="app-switcher-panel__you-are-in">
            {t("app_switcher.you_are_in")}
          </span>
          <span className="app-switcher-panel__app-name">
            {t("app_switcher.apps.drive.label")}
          </span>
        </div>
      </div>

      {jumpTo.length > 0 && (
        <>
          <div className="app-switcher-panel__divider" />
          <span className="app-switcher-panel__section-label">
            {t("app_switcher.jump_to")}
          </span>
          <div className="app-switcher-panel__grid">
            {jumpTo.map((id) => (
              <a
                key={id}
                href={appUrls[id]}
                className="app-switcher-panel__app"
                onClick={onClose}
              >
                <AppIcon id={id} size={36} />
                <div className="app-switcher-panel__app-info">
                  <span className="app-switcher-panel__app-label">
                    {t(`app_switcher.apps.${id}.label`)}
                  </span>
                  <span className="app-switcher-panel__app-subtitle">
                    {t(`app_switcher.apps.${id}.subtitle`)}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const AppSwitcherButton = () => {
  const { config } = useConfig();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [opensUpward, setOpensUpward] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const appUrls = config?.APP_URLS ?? {};
  const hasOtherApps = APP_ORDER.some(
    (id) => id in appUrls && id in APP_META,
  );

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  if (!hasOtherApps) return null;

  const handleOpen = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpensUpward(spaceBelow < 320);
    }
    setIsOpen((v) => !v);
  };

  return (
    <div ref={ref} className="app-switcher-panel">
      <Button
        color="brand"
        variant="tertiary"
        aria-label={t("app_switcher.switch_app")}
        aria-expanded={isOpen}
        onClick={handleOpen}
        icon={
          <span className="app-switcher-panel__trigger-grid" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 18 18">
              {[...APP_ORDER, APP_ORDER[0], APP_ORDER[1]].map((id, i) => (
                <circle
                  key={i}
                  cx={3 + (i % 3) * 6}
                  cy={3 + Math.floor(i / 3) * 6}
                  r={2}
                  fill={APP_META[id].color}
                />
              ))}
            </svg>
          </span>
        }
      />
      {isOpen && (
        <Panel
          onClose={() => setIsOpen(false)}
          opensUpward={opensUpward}
          appUrls={appUrls}
        />
      )}
    </div>
  );
};
