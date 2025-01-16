// CONFIG

const origin = "https://www.thanku.social";
const thankuLogoUrl = `${origin}/thanku-logo-row.v0000001.svg`;

// HELPER

const log = (() => {
  let hasDebug = false;
  try {
    hasDebug = localStorage.getItem("debug") === "thanku";
  } catch (_) {
    // ignore
  }
  return hasDebug
    ? (...args) => {
        console.log(...args);
      }
    : Function.prototype;
})();

function isValidLang(lang) {
  return ["de", "en"].includes(lang);
}

function isValidSlug(slug) {
  return typeof slug === "string" && /[a-z0-9][a-z0-9-]+[a-z0-9]/.test(slug);
}

function toProfileUrl({ protocol = "https://", slug, lang }) {
  return `${protocol}thx.to/:${slug}${lang ? `/${lang}` : ""}`;
}

function toProfileUrlShort(slug) {
  return toProfileUrl({ protocol: "", slug });
}

function toError({ message, id }) {
  const error = new Error(message);
  error.id = id;
  return error;
}

function htmlEscape(string) {
  return string
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function html(strings, ...args) {
  return strings
    .map((str, i) =>
      i < args.length
        ? str +
          (args[i].__html
            ? [].concat(args[i].__html).join("")
            : htmlEscape(String(args[i])))
        : str
    )
    .join("");
}

function createStore({ getState, setState, update, onUpdate }) {
  const dispatch = (action) =>
    requestAnimationFrame(() => {
      const prevState = { ...getState() };
      const [nextState, cmd] = update(prevState, action);
      if (prevState !== nextState) {
        log("update:state", action, { prevState, nextState });
        setState(nextState);
        onUpdate({ ...nextState }, prevState);
      }
      cmd({ ...nextState }, dispatch);
    });
  return dispatch;
}

// API CLIENT

const Api = {
  fetchProfileData(slug) {
    return fetch(`${origin}/api/profile/${slug}`, {
      headers: { "Content-Type": "application/json" },
    }).then(
      (res) => {
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
    );
  },
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
      --scale: 1;

      display: block;
      all: initial;
    }
    .container {
      background-color: var(--bg-color);
      background-image: var(--bg-image);
      border-radius: 0.75em;
      color: var(--color-text-base);
      display: block;
      font-family: var(--font-family);
      font-size: calc(16px * var(--scale));
      line-height: 125%;
      padding: 1.25em 1.5em;
      text-decoration: none;
    }
    .headline {
      color: var(--color-text-headline);
      font-size: 1.25em;
      line-height: 125%;
      margin: 0.25em 0;
      text-align: center;
    }
    .error-message {
      color: var(--color-text-emphasis);
      margin: 0.5em 0;
      text-align: center;
    }
    .info-message {
      margin: 0.5em 0;
      text-align: center;
    }
    .profile-url {
      font-family: monospace;
      font-size: 1em;
      margin: 0;
      text-align: center;
    }
    .impact-list {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      list-style: none;
      margin: 0.625em auto 0 auto;
      padding: 0;
    }
    .cause-image {
      height: 6.25em;
      width: 6.25em;
    }
    .cause-name {
      font-size: 0.875em;
    }
    .impact-item {
      min-width: 7.5em;
      padding: 0.75em;
      text-align: center;
    }
    .impact-value {
      color: var(--color-text-emphasis);
    }
    .powered-by {
      padding: 0;
      text-align: center;
      margin: 1em 0 0.5em 0;
    }
    .powered-by-text {
      font-size: 0.85em;
    }
    .logo {
      background-color: white;
      border-radius: 0.25rem;
      display: inline-block;
      height: 1em;
      margin-left: 0.25rem;
      padding: 0.35em 0.5rem 0.25rem 0.5rem;
      vertical-align: middle;
      width: 5em;
    }
  </style>
`;

// TRANSLATIONS

const translations = {
  de: {
    profileLinkTitle: ({ nickname }) =>
      `ThankU-Wallet von ${nickname} besuchen`,
    headline: ({ nickname }) => `${nickname} sagt Danke`,
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
      headline: "Sag Danke und tu Gutes",
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
    profileLinkTitle: ({ nickname }) => `Visit ${nickname}'s ThankU wallet`,
    headline: ({ nickname }) => `${nickname} says ThankU`,
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
      headline: "Say ThankU and Do Good",
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

function renderImpactBadge(name) {
  return html`<img
    src="${`${origin}/donateeGroup/${name}.v0000001.png`}"
    alt="${name}"
    width="100"
    height="100"
    class="cause-image"
  />`;
}

function renderData({
  t,
  lang,
  data: {
    user: { nickname, slug },
    donations,
  },
}) {
  return html`
    <a
      href="${toProfileUrl({ slug, lang })}"
      title="${t.profileLinkTitle({ nickname })}"
      class="container"
    >
      <h2 class="headline">${t.headline({ nickname })}</h2>
      <p class="profile-url">${toProfileUrlShort(slug)}</p>
      <ul class="impact-list">
        ${{
          __html: Object.entries(donations)
            .filter(([name]) => name !== "ThankU") // omit cause ThankU
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)) // sort by name
            .map(
              ([name, value]) =>
                html`<li class="impact-item">
                  ${{ __html: renderImpactBadge(name) }}
                  <br />
                  <strong class="cause-name">${t.cause[name]}</strong>
                  <br />
                  <span class="impact-value"
                    >${t.impact[name]({ value: Math.round(value) })}</span
                  >
                </li>`
            ),
        }}
      </ul>
      <p class="powered-by">
        <span class="powered-by-text">powered by</span>
        <img
          src="${thankuLogoUrl}"
          width="100"
          height="20"
          alt="ThankU"
          class="logo"
        />
      </p>
    </a>
  `;
}

function renderLoading({ t }) {
  return html`
    <div class="container">
      <h2 class="headline">${t.loading.headline}</h2>
      <p class="info-message">${t.loading.message}</p>
    </div>
  `;
}

function renderError({ t, error }) {
  return html`
    <div class="container">
      <h2 class="headline">${t.error.headline}</h2>
      <p class="error-message">${t.error[error.id] || error.message}</p>
    </div>
  `;
}

// COMMANDS

const noCmd = Function.prototype;

function loadDataCmd(state, dispatch) {
  dispatch({ name: "LOAD_DATA_PENDING" });
  Api.fetchProfileData(state.slug).then(
    (data) => dispatch({ name: "LOAD_DATA_SUCCEEDED", payload: data }),
    (error) => dispatch({ name: "LOAD_DATA_FAILED", payload: { error } })
  );
}

// UPDATE

function update(state, { name, payload }) {
  switch (name) {
    case "LOAD_DATA_PENDING": {
      return [{ ...state, profile: { loading: true } }, noCmd];
    }
    case "LOAD_DATA_FAILED": {
      return [{ ...state, profile: { error: payload.error } }, noCmd];
    }
    case "LOAD_DATA_SUCCEEDED": {
      return [{ ...state, profile: { data: payload } }, noCmd];
    }
    case "LANG_UPDATED": {
      return [{ ...state, lang: payload }, noCmd];
    }
    case "SLUG_UPDATED": {
      return [
        { ...state, slug: payload },
        state.isConnected ? loadDataCmd : noCmd,
      ];
    }
    case "CONNECTED": {
      return [{ ...state, isConnected: true }, loadDataCmd];
    }
    case "DISCONNECTED": {
      return [{ ...state, isConnected: false }, noCmd];
    }
    default: {
      return [state, noCmd];
    }
  }
}

// RENDER

const render = (elem) => (state, prevState) => {
  const hasChanged = (attr) => prevState[attr] !== state[attr];
  if (hasChanged("profile") || hasChanged("lang")) {
    const t = translations[state.lang] || translations.en;
    switch (true) {
      case !!state.profile.loading:
        elem.innerHTML = renderLoading({ t });
        break;
      case !!state.profile.error:
        elem.innerHTML = renderError({ t, error: state.profile.error });
        break;
      case !!state.profile.data:
        elem.innerHTML = renderData({
          t,
          lang: state.lang,
          data: state.profile.data,
        });
        break;
      default:
      // do nothing
    }
  }
};

// WEB COMPONENT

const STATE = Symbol("STATE");

class ThankUImpactWidget extends HTMLElement {
  static get observedAttributes() {
    return ["slug", "lang"];
  }

  [STATE] = {
    isConnected: false,
    profile: { notAsked: true },
    // attributes
    slug: "universe",
    lang: "en",
  };

  get slug() {
    return this[STATE].slug;
  }
  set slug(slug) {
    if (isValidSlug(slug) && this.slug !== slug) {
      this.dispatch({ name: "SLUG_UPDATED", payload: slug });
    }
  }

  get lang() {
    return this[STATE].lang;
  }
  set lang(lang) {
    if (isValidLang(lang) && this.lang !== lang) {
      this.dispatch({ name: "LANG_UPDATED", payload: lang });
    }
  }

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.innerHTML = styles + `<div id="wrapper"></div>`;
    const $wrapper = shadow.getElementById("wrapper");
    this.dispatch = createStore({
      getState: () => this[STATE],
      setState: (state) => (this[STATE] = state),
      update,
      onUpdate: render($wrapper),
    });
  }

  connectedCallback() {
    if (this.isConnected) {
      this.dispatch({ name: "CONNECTED" });
    }
  }

  disconnectedCallback() {
    this.dispatch({ name: "DISCONNECTED" });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (newValue === oldValue) return;
    switch (name) {
      case "slug":
        this.slug = newValue;
        break;
      case "lang":
        this.lang = newValue;
        break;
    }
  }
}

customElements.define("thanku-impact-widget", ThankUImpactWidget);

export { ThankUImpactWidget };
