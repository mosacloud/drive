import { cunninghamConfig } from "@gouvfr-lasuite/ui-kit";
import deepMerge from "deepmerge";

const themesImages = {
  "anct-light": {
    favicon: "/assets/anct_favicon.png",
    logo: "/assets/anct_logo_beta.svg",
    "logo-icon": "/assets/anct_logo-icon.svg",
  },
  "dsfr-dark": {
    favicon: "/assets/favicon.png",
    logo: "/assets/logo_beta.svg",
    "logo-icon": "/assets/logo-icon_beta.svg",
  },
  "dsfr-light": {
    favicon: "/assets/favicon.png",
    logo: "/assets/logo_beta.svg",
    "logo-icon": "/assets/logo-icon_beta.svg",
  },
  mosa: {
    favicon: "/assets/favicon-light.png",
    logo: "/assets/mosa-horizontal.svg",
    "logo-icon": "/assets/mosa.svg",
  },
};

const themesGaufre = {
  "anct-light": {
    widgetPath: "https://static.suite.anct.gouv.fr/widgets/lagaufre.js",
    apiUrl:
      "https://operateurs.suite.anct.gouv.fr/api/v1.0/lagaufre/services/?operator=9f5624fc-ef99-4d10-ae3f-403a81eb16ef&siret=21870030000013",
  },
  "dsfr-dark": {
    widgetPath: "https://static.suite.anct.gouv.fr/widgets/lagaufre.js",
    apiUrl: "https://lasuite.numerique.gouv.fr/api/services",
  },
  "dsfr-light": {
    widgetPath: "https://static.suite.anct.gouv.fr/widgets/lagaufre.js",
    apiUrl: "https://lasuite.numerique.gouv.fr/api/services",
  },
  mosa: {
    widgetPath: "",
    apiUrl: "",
  },
};

const getComponents = (theme: keyof typeof themesImages) => {
  return {
    datagrid: {
      "body--background-color-hover":
        "ref(contextuals.background.semantic.contextual.primary)",
    },
    gaufre: {
      widgetPath: `'${themesGaufre[theme].widgetPath}'`,
      apiUrl: `'${themesGaufre[theme].apiUrl}'`,
    },
    favicon: {
      src: `'${themesImages[theme].favicon}'`,
    },
    logo: {
      src: `url('${themesImages[theme].logo}')`,
    },
    "logo-icon": {
      src: `url('${themesImages[theme]["logo-icon"]}')`,
    },
  };
};

const defaultConfig = deepMerge(cunninghamConfig, {
  themes: {
    "anct-light": {
      components: getComponents("anct-light"),
    },
    "dsfr-light": {
      components: getComponents("dsfr-light"),
    },
    "dsfr-dark": {
      components: getComponents("dsfr-dark"),
    },
    mosa: {
      globals: {
        colors: {
          "brand-050": "#E7EDFE",
          "brand-100": "#CFDCFD",
          "brand-150": "#B7CAFC",
          "brand-200": "#9FB9FB",
          "brand-250": "#87A7FA",
          "brand-300": "#6F96F9",
          "brand-350": "#5784F8",
          "brand-400": "#3F73F7",
          "brand-450": "#2761F6",
          "brand-500": "#0F50F5",
          "brand-550": "#0443F2",
          "brand-600": "#033BD9",
          "brand-650": "#0334C0",
          "brand-700": "#022CA7",
          "brand-750": "#02258E",
          "brand-800": "#011D75",
          "brand-850": "#01165C",
          "brand-900": "#010E43",
          "brand-950": "#00072A",
          "logo-1": "#0443F2",
        },
        font: {
          families: {
            base: "Inter, Roboto Flex Variable, sans-serif",
            accent: "Inter, Roboto Flex Variable, sans-serif",
          },
        },
      },
      components: {
        ...getComponents("mosa"),
        "la-gaufre": false,
        "home-proconnect": false,
        beta: false,
        footer: false,
      },
    },
  },
});

const config = defaultConfig;

export default config;
