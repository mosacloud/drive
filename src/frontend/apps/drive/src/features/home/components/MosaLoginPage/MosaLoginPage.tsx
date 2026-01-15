import Head from 'next/head';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { login } from '@/features/auth/Auth';

import {
  ArrowRight,
  ChevronDown,
  EuStars,
  GlobeIcon,
} from './MosaLoginPage.icons';

const LANGUAGES = [
  { code: 'en', value: 'en-us', label: 'EN' },
  { code: 'nl', value: 'nl-nl', label: 'NL' },
  { code: 'fr', value: 'fr-fr', label: 'FR' },
  { code: 'de', value: 'de-de', label: 'DE' },
];

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentLang = useMemo(() => {
    const lang = i18n.language?.split('-')[0] || 'en';
    return LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];
  }, [i18n.language]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (lang: (typeof LANGUAGES)[0]) => {
    i18n.changeLanguage(lang.value).catch((err) => {
      console.error('Error changing language', err);
    });
    setIsOpen(false);
  };

  return (
    <div className="mosa-login__lang-container" ref={ref}>
      <button
        className="mosa-login__lang-button"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <GlobeIcon />
        <span>{currentLang.label}</span>
        <ChevronDown rotated={isOpen} />
      </button>
      {isOpen && (
        <div className="mosa-login__lang-dropdown">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              className={`mosa-login__lang-option ${currentLang.code === lang.code ? 'mosa-login__lang-option--selected' : ''}`}
              onClick={() => handleSelect(lang)}
              type="button"
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const MosaLoginPage = () => {
  const { t } = useTranslation();

  const handleLogin = () => {
    login();
  };

  return (
    <>
      <Head>
        <title>{t('mosa.login.page_title')}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600&family=Poppins:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="mosa-login">
        <div className="mosa-login__brand-panel">
          <div className="mosa-login__brand-bg">
            <div className="mosa-login__gradient-base" />
            <div className="mosa-login__grid-overlay" />
            <div className="mosa-login__orb mosa-login__orb--1" />
            <div className="mosa-login__orb mosa-login__orb--2" />
            <div className="mosa-login__orb mosa-login__orb--3" />
          </div>

          <div className="mosa-login__brand-content">
            <div className="mosa-login__app-icon">
              <img src="/assets/mosa.svg" alt="mosa.cloud" />
            </div>
            <h1 className="mosa-login__brand-title">mosa.cloud</h1>
            <p className="mosa-login__brand-tagline">
              {t('mosa.login.tagline')}
            </p>
          </div>

          <div className="mosa-login__brand-footer">
            <div className="mosa-login__eu-flag">
              <EuStars />
            </div>
            <span>{t('mosa.login.built_in_eu')}</span>
          </div>
        </div>

        <div className="mosa-login__form-panel">
          <div className="mosa-login__lang-wrapper">
            <LanguageSelector />
          </div>

          <div className="mosa-login__mobile-accents" />

          <div className="mosa-login__mobile-header">
            <div className="mosa-login__mobile-logo" aria-label="mosa.cloud logo" />
            <span className="mosa-login__mobile-brand">mosa.cloud</span>
          </div>

          <div className="mosa-login__form-container">
            <div className="mosa-login__form-header">
              <h2>
                {t('mosa.login.welcome_to')}{' '}
                <span className="mosa-login__product-highlight">Drive</span>
              </h2>
              <p>{t('mosa.login.product_description')}</p>
            </div>

            <div className="mosa-login__actions">
              <button
                className="mosa-login__primary-button"
                onClick={handleLogin}
                type="button"
              >
                <span>{t('mosa.login.sign_in_button')}</span>
                <ArrowRight />
              </button>
            </div>

            <p className="mosa-login__signup-prompt">
              {t('mosa.login.no_account')}{' '}
              <a href="mailto:hi@mosa.cloud">{t('mosa.login.contact_us')}</a>
            </p>
          </div>

          <div className="mosa-login__mobile-footer">
            <div className="mosa-login__mobile-eu-flag">
              <EuStars />
            </div>
            <span>{t('mosa.login.built_in_eu')}</span>
          </div>
        </div>
      </div>
    </>
  );
};
