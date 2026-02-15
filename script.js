const checkerConfig = {
  domain: {
    label: "Enter domain",
    placeholder: "e.g. example.com",
    sampleTarget: "nayabet.com",
    scoreLabel: "Estimated Domain Authority",
    fields: [
      { key: "refDomains", label: "Referring Domains", min: 0, max: 10000, sample: 420 },
      { key: "backlinks", label: "Total Backlinks", min: 0, max: 200000, sample: 15200 },
      { key: "spamScore", label: "Spam Score (%)", min: 0, max: 100, sample: 6 },
      { key: "domainAge", label: "Domain Age (years)", min: 0, max: 30, sample: 7 },
      { key: "contentQuality", label: "Content Quality (0-100)", min: 0, max: 100, sample: 78 },
      { key: "brandSignals", label: "Brand Signals (0-100)", min: 0, max: 100, sample: 70 }
    ],
    run: (target, values) => {
      const score = Math.round(
        values.refDomains * 0.24 +
          values.backlinks * 0.16 +
          values.domainAge * 0.16 +
          values.contentQuality * 0.18 +
          values.brandSignals * 0.16 -
          values.spamScore * 0.2
      );

      return buildResult("Domain Authority", target, clamp(score, 1, 100), values.spamScore);
    }
  },
  page: {
    label: "Enter page URL",
    placeholder: "e.g. https://example.com/blog/post",
    sampleTarget: "https://nayabet.com/blog/seo-guide",
    scoreLabel: "Estimated Page Authority",
    fields: [
      { key: "pageBacklinks", label: "Page Backlinks", min: 0, max: 20000, sample: 260 },
      { key: "linkingDomains", label: "Linking Domains", min: 0, max: 3000, sample: 82 },
      { key: "contentDepth", label: "Content Depth (0-100)", min: 0, max: 100, sample: 74 },
      { key: "onPageSeo", label: "On-page SEO (0-100)", min: 0, max: 100, sample: 80 },
      { key: "internalLinks", label: "Internal Links", min: 0, max: 400, sample: 32 },
      { key: "urlHealth", label: "URL Health (0-100)", min: 0, max: 100, sample: 84 }
    ],
    run: (target, values) => {
      const score = Math.round(
        values.pageBacklinks * 0.2 +
          values.linkingDomains * 0.2 +
          values.contentDepth * 0.2 +
          values.onPageSeo * 0.2 +
          values.internalLinks * 0.06 +
          values.urlHealth * 0.14
      );

      return buildResult("Page Authority", target, clamp(score, 1, 100), 0);
    }
  }
};

const tabs = document.querySelectorAll(".tab");
const targetInput = document.getElementById("targetInput");
const inputLabel = document.getElementById("inputLabel");
const metricsGrid = document.getElementById("metricsGrid");
const scoreLabel = document.getElementById("scoreLabel");
const scoreValue = document.getElementById("scoreValue");
const resultTitle = document.getElementById("resultTitle");
const resultList = document.getElementById("resultList");
const scoreChip = document.getElementById("scoreChip");
const checkBtn = document.getElementById("checkBtn");
const sampleBtn = document.getElementById("sampleBtn");
const clearBtn = document.getElementById("clearBtn");

let activeTab = "domain";

function setActiveTab(tabKey) {
  activeTab = tabKey;
  tabs.forEach((tab) => {
    const isActive = tab.dataset.tab === tabKey;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });

  const config = checkerConfig[tabKey];
  inputLabel.textContent = config.label;
  targetInput.placeholder = config.placeholder;
  targetInput.value = "";
  scoreLabel.textContent = config.scoreLabel;
  renderMetricFields(config.fields);
  resetResult();
}

function renderMetricFields(fields) {
  metricsGrid.innerHTML = "";
  fields.forEach((field) => {
    const wrapper = document.createElement("div");
    wrapper.className = "metric-field";

    const label = document.createElement("label");
    label.setAttribute("for", field.key);
    label.textContent = field.label;

    const input = document.createElement("input");
    input.className = "metric-input";
    input.type = "number";
    input.id = field.key;
    input.min = String(field.min);
    input.max = String(field.max);
    input.placeholder = `${field.min}-${field.max}`;

    wrapper.append(label, input);
    metricsGrid.appendChild(wrapper);
  });
}

function getMetricValues() {
  const fields = checkerConfig[activeTab].fields;
  const values = {};

  for (const field of fields) {
    const raw = document.getElementById(field.key).value.trim();
    if (!raw) {
      return { error: `Please fill ${field.label}.` };
    }

    const value = Number(raw);
    if (Number.isNaN(value) || value < field.min || value > field.max) {
      return { error: `${field.label} must be between ${field.min} and ${field.max}.` };
    }

    const normalized = field.max > 100 ? Math.log10(value + 1) * (100 / Math.log10(field.max + 1)) : value;
    values[field.key] = normalized;
  }

  return { values };
}

function buildResult(type, target, score, spamScore) {
  const status = score >= 70 ? "success" : score >= 45 ? "warn" : "fail";
  const band = score >= 80 ? "Excellent" : score >= 65 ? "Strong" : score >= 45 ? "Average" : "Needs improvement";

  const details = [
    [`Target: ${target}`, true],
    [`${type} band: ${band}`, true],
    ["Score model: backlink + trust + quality signals", true]
  ];

  if (type === "Domain Authority") {
    details.push([`Spam score impact considered (${Math.round(spamScore)}%)`, spamScore <= 30]);
  }

  return {
    score,
    status,
    title: `${type} estimated at ${score}/100`,
    details
  };
}

function resetResult() {
  scoreChip.className = "chip neutral";
  scoreChip.textContent = "Waiting";
  scoreValue.textContent = "--";
  resultTitle.textContent = "No analysis yet.";
  resultList.innerHTML = "";
}

function renderResult(result) {
  scoreChip.className = `chip ${result.status}`;
  scoreChip.textContent = result.status.toUpperCase();
  scoreValue.textContent = String(result.score);
  resultTitle.textContent = result.title;
  resultList.innerHTML = "";

  result.details.forEach(([text, ok]) => {
    const li = document.createElement("li");
    li.textContent = `${ok ? "✅" : "❌"} ${text}`;
    resultList.appendChild(li);
  });
}

function runCheck() {
  const target = targetInput.value.trim();
  if (!target) {
    scoreChip.className = "chip warn";
    scoreChip.textContent = "INPUT";
    resultTitle.textContent = "Please enter target first.";
    return;
  }

  const { values, error } = getMetricValues();
  if (error) {
    scoreChip.className = "chip warn";
    scoreChip.textContent = "INPUT";
    resultTitle.textContent = error;
    return;
  }

  const result = checkerConfig[activeTab].run(target, values);
  renderResult(result);
}

function fillSample() {
  const config = checkerConfig[activeTab];
  targetInput.value = config.sampleTarget;
  config.fields.forEach((field) => {
    document.getElementById(field.key).value = String(field.sample);
  });
}

function clearAll() {
  targetInput.value = "";
  checkerConfig[activeTab].fields.forEach((field) => {
    document.getElementById(field.key).value = "";
  });
  resetResult();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

tabs.forEach((tab) => tab.addEventListener("click", () => setActiveTab(tab.dataset.tab)));
checkBtn.addEventListener("click", runCheck);
sampleBtn.addEventListener("click", () => {
  fillSample();
  runCheck();
});
clearBtn.addEventListener("click", clearAll);

setActiveTab(activeTab);
