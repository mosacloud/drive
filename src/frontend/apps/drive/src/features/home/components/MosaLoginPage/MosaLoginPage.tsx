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
          <div className="mosa-login__gradient-base" />
          <div className="mosa-login__grid-overlay" />

          <div
            className="mosa-login__accent-dot"
            style={{
              left: '64px',
              top: 'calc(50% - 160px)',
              width: '4px',
              height: '4px',
              background: 'rgba(255, 255, 255, 0.5)',
            }}
          />
          <div
            className="mosa-login__accent-dot"
            style={{
              left: '256px',
              top: 'calc(50% - 224px)',
              width: '12px',
              height: '12px',
              background: 'rgba(255, 255, 255, 0.7)',
            }}
          />
          <div
            className="mosa-login__accent-dot"
            style={{
              left: '64px',
              top: 'calc(50% + 96px)',
              width: '5px',
              height: '5px',
              background: 'rgba(255, 255, 255, 0.55)',
            }}
          />
          <div
            className="mosa-login__accent-dot"
            style={{
              left: '192px',
              top: 'calc(50% + 224px)',
              width: '6px',
              height: '6px',
              background: 'rgba(255, 255, 255, 0.55)',
            }}
          />
          <div
            className="mosa-login__accent-dot"
            style={{
              left: '384px',
              top: 'calc(50% + 160px)',
              width: '4px',
              height: '4px',
              background: 'rgba(255, 255, 255, 0.4)',
            }}
          />

          <div className="mosa-login__brand-content">
            <img src="/logos/mosa-cloud-logo-white.svg" alt="mosa.cloud" />
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
            <img src="/logos/mosa-cloud-logo.svg" alt="mosa.cloud" />
          </div>

          <div className="mosa-login__form-container">
            <div className="mosa-login__form-header">
              <p className="mosa-login__eyebrow">
                {t('mosa.login.product_description')}
              </p>
              <h2>
                {t('mosa.login.welcome_to')}{' '}
                <span className="mosa-login__product-highlight">Drive</span>
              </h2>
            </div>

            <div className="mosa-login__divider" />

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
