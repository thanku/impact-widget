import { html, define } from "https://unpkg.com/hybrids@^4/src";

// CONFIG

const origin = "https://www.thanku.social";

// HELPER

const toProfileUrl = ({ protocol = "https://", slug, lang }) =>
  `${protocol}thx.to/:${slug}${lang ? `/${lang}` : ""}`;

const toProfileUrlShort = (slug) => toProfileUrl({ protocol: "", slug });

const toError = ({ message, id }) => {
  const error = new Error(message);
  error.id = id;
  return error;
};

// API CLIENT

const Api = {
  fetchProfileData: (slug) =>
    fetch(`${origin}/api/profile/${slug}`, {
      headers: { "Content-Type": "application/json" },
    }).then(
      async (res) => {
        if (res.status >= 400) {
          throw toError({
            message: "Data not available",
            id: "dataNotAvailable",
          });
        }
        return res.json().catch(() => {
          throw toError({ message: "Data malformed", id: "dataMalformed" });
        });
      },
      () => {
        throw toError({
          message: "Connection problems",
          id: "connectionProblems",
        });
      }
    ),
};

// STYLES

const styles = html`
  <style>
    :host {
      --bg-color: #dff1f4;
      --bg-image: linear-gradient(90deg, #eaf6f1, #d4edf7);
      --color-text-base: rgb(32, 44, 85);
      --color-text-headline: rgb(1, 136, 139);
      --color-text-emphasis: rgb(236, 118, 20);
      --font-family: "Exo", sans-serif;
    }
    .container {
      background-color: var(--bg-color);
      background-image: var(--bg-image);
      border-radius: 12px;
      color: var(--color-text-base);
      display: block;
      font-family: var(--font-family);
      font-size: 16px;
      padding: 20px 24px;
      text-decoration: none;
    }
    .headline {
      color: var(--color-text-headline);
      font-size: 20px;
      margin: 6px 0;
      text-align: center;
    }
    .error-message {
      color: var(--color-text-emphasis);
      margin: 8px 0;
      text-align: center;
    }
    .info-message {
      margin: 8px 0;
      text-align: center;
    }
    .profile-url {
      font-family: monospace;
      font-size: 15px;
      margin: 0;
      text-align: center;
    }
    .impact-list {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-around;
      list-style: none;
      margin: 10px auto 0 auto;
      max-width: 440px;
      padding: 0;
    }
    .cause-name {
      font-size: 14px;
    }
    .impact-item {
      padding: 10px;
      text-align: center;
      line-height: 125%;
    }
    .impact-value {
      color: var(--color-text-emphasis);
    }
  </style>
`;

// TRANSLATIONS

const translations = {
  de: {
    profileLinkTitle: ({ nickname }) => `ThankU-Seite von ${nickname} besuchen`,
    headline: ({ nickname }) => `Impact von ${nickname} mit ThankU`,
    cause: {
      CleanOcean: "Ozean säubern",
      PlantTrees: "Bäume pflanzen",
      ProtectWildlife: "Wildtiere schützen",
      ThankU: "ThankU",
    },
    impact: {
      CleanOcean: ({ value }) => `${value} kg Plastik`,
      PlantTrees: ({ value }) => `${value} ${value === 1 ? "Baum" : "Bäume"}`,
      ProtectWildlife: ({ value }) => `${value} m² Habitat`,
      ThankU: () => "Wachstum",
    },
    loading: {
      headline: "Mein Impact mit ThankU",
      message: "Bitte warten ...",
    },
    error: {
      headline: "Datenabruf fehlgeschlagen",
      dataNotAvailable: "Daten sind nicht verfügbar",
      dataMalformed: "Daten sind fehlerhaft",
      connectionProblems: "Verbindungsprobleme",
    },
  },
  en: {
    profileLinkTitle: ({ nickname }) => `Visit ${nickname}'s ThankU page`,
    headline: ({ nickname }) => `${nickname}'s impact with ThankU`,
    cause: {
      CleanOcean: "Clean the ocean",
      PlantTrees: "Plant trees",
      ProtectWildlife: "Protect wildlife",
      ThankU: "ThankU",
    },
    impact: {
      CleanOcean: ({ value }) => `${value} kg plastic`,
      PlantTrees: ({ value }) => `${value} tree${value === 1 ? "" : "s"}`,
      ProtectWildlife: ({ value }) => `${value} m² habitat`,
      ThankU: () => "growth",
    },
    loading: {
      headline: "My impact with ThankU",
      message: "Please wait ...",
    },
    error: {
      headline: "Fetching data failed",
      dataNotAvailable: "Data is not available",
      dataMalformed: "Data is malformed",
      connectionProblems: "Connection problems",
    },
  },
};

// RENDER HELPER

const renderImpactBadge = (name) =>
  html`<img
    src=${`${origin}/donateeGroup/${name}.v0000001.png`}
    alt=${name}
    width="100"
    height="100"
  />`;

const renderData = ({ user: { nickname, slug }, donations }) => ({
  t,
  lang,
}) => html`
  <a
    href=${toProfileUrl({ slug, lang })}
    title=${t.profileLinkTitle({ nickname })}
    class="container"
  >
    <h2 class="headline">${t.headline({ nickname })}</h2>
    <p class="profile-url">${toProfileUrlShort(slug)}</p>
    <ul class="impact-list">
      ${Object.entries(donations)
        .filter(([name]) => name !== "ThankU") // omit cause ThankU
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)) // sort by name
        .map(([name, value]) =>
          html`<li class="impact-item">
            ${renderImpactBadge(name)}
            <br />
            <strong class="cause-name">${t.cause[name]}</strong>
            <br />
            <span class="impact-value">${t.impact[name]({ value })}</span>
          </li>`.key(name)
        )}
    </ul>
  </a>
`;

const renderLoading = ({ t }) => html`
  <div class="container">
    <h2 class="headline">${t.loading.headline}</h2>
    <p class="info-message">${t.loading.message}</p>
  </div>
`;

const renderError = (error) => ({ t }) =>
  html`
    <div class="container">
      <h2 class="headline">${t.error.headline}</h2>
      <p class="error-message">${t.error[error.id] || error.message}</p>
    </div>
  `;

// WEB COMPONENT

const ThankUImpactWidget = {
  slug: "universe",
  lang: "en",
  data: ({ slug }) => Api.fetchProfileData(slug),
  render: ({ data, lang }) => {
    const t = translations[lang] || translations.en;
    return html`
      ${styles}
      ${html.resolve(
        data
          .then(renderData)
          .catch(renderError)
          .then((render) => render({ t, lang })),
        renderLoading({ t })
      )}
    `;
  },
};

define("thanku-impact-widget", ThankUImpactWidget);

export { ThankUImpactWidget };
