import { Button } from '@openfun/cunningham-react';
import { GlobalLayout } from "@/features/layouts/components/global/GlobalLayout";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import {
  Hero,
  Footer,
  MainLayout,
  HomeGutter,
} from "@gouvfr-lasuite/ui-kit";
import { login, useAuth } from "@/features/auth/Auth";
import { gotoLastVisitedItem } from "@/features/explorer/utils/utils";
import { useEffect } from "react";
import logoIcon from "@/assets/logo-icon.svg";
import logo from "@/assets/logo.svg";
import logoGouv from "@/assets/logo-gouv.svg";
import banner from "@/assets/home/banner.png";
import {
  HeaderRight,
  LanguagePicker,
} from "@/features/layouts/components/header/Header";
import {
  addToast,
  Toaster,
  ToasterItem,
} from "@/features/ui/components/toaster/Toaster";
export default function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      gotoLastVisitedItem();
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
  }, []);

  if (user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>{t("app_title")}</title>
        <meta name="description" content={t("app_description")} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.png" />
      </Head>

      <HomeGutter>
        <Hero
          logo={<img src={logoIcon.src} alt="DocLogo" width={64} />}
          banner={banner.src}
          title={t("home.title")}
          subtitle={t("home.subtitle")}
          mainButton={<Button onClick={login}>{t("home.loginMessage")}</Button>}
        />
      </HomeGutter>
      <Footer />
    </>
  );
}

HomePage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <div className="drive__home">
      <GlobalLayout>
        <MainLayout
          enableResize
          hideLeftPanelOnDesktop={true}
          leftPanelContent={
            <div className="drive__home__left-panel">
              <LanguagePicker />
            </div>
          }
          icon={
            <div className="drive__header__left">
              <img src={logoGouv.src} alt="" />
              <img src={logo.src} alt="" />
            </div>
          }
          rightHeaderContent={<HeaderRight />}
        >
          {page}
          <Toaster />
        </MainLayout>
      </GlobalLayout>
    </div>
  );
};
