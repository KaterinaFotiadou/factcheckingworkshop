(function () {
  // Extract the article's title and main text
  function extractArticleText() {
    const title = document.querySelector("h1")?.innerText || document.title;
    const paragraphs = Array.from(document.querySelectorAll("article p, main p"))
      .slice(0, 5)
      .map((p) => p.innerText)
      .join(" ");
    return { title, excerpt: paragraphs.slice(0, 1500) };
  }

  const article = extractArticleText();

  // If not enough content was found 
  // don't show anything 
  if (!article.excerpt || article.excerpt.length < 200) return;

  showLight("loading");

  chrome.runtime.sendMessage(
    { type: "CHECK_CLAIM_LIVE", claim: article.title, excerpt: article.excerpt, url: window.location.href },
    (response) => {
      if (response && response.success && response.data) {
        const verdict = response.data.verdict; // "agree" | "disagree" | "mixed"
        const color = verdict === "agree" ? "green" : verdict === "disagree" ? "red" : "orange";
        showLight(color, response.data.note, response.data.sources);
      } else {
        showLight("gray", "Check failed — could not reach the backend");
      }
    }
  );

  function showLight(state, note, sources) {
    const colors = {
      loading: "#B4B2A9",
      green: "#1D9E75",
      red: "#E24B4A",
      orange: "#EF9F27",
      gray: "#888780"
    };

    let light = document.getElementById("verification-traffic-light");
    if (!light) {
      light = document.createElement("div");
      light.id = "verification-traffic-light";
      light.style.cssText = `
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 2147483647;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3), inset 0 0 0 3px rgba(255,255,255,0.5);
        cursor: pointer;
        transition: background 0.3s;
      `;
      document.body.appendChild(light);

      // Tooltip panel that appears when the light is clicked
      const panel = document.createElement("div");
      panel.id = "verification-traffic-panel";
      panel.style.cssText = `
        position: fixed;
        top: 46px;
        right: 16px;
        z-index: 2147483647;
        max-width: 300px;
        background: white;
        border-radius: 10px;
        padding: 12px 14px;
        font-family: -apple-system, "Segoe UI", Roboto, sans-serif;
        font-size: 12px;
        color: #2C2C2A;
        box-shadow: 0 4px 16px rgba(0,0,0,0.25);
        display: none;
      `;
      document.body.appendChild(panel);

      light.addEventListener("click", () => {
        panel.style.display = panel.style.display === "none" ? "block" : "none";
      });
    }

    light.style.background = colors[state] || colors.gray;
    light.title = note || "Checking…";

    const panel = document.getElementById("verification-traffic-panel");
    if (note) {
      let html = `<div style="font-weight:600;margin-bottom:6px">${note}</div>`;
      if (sources && sources.length) {
        html += sources
          .slice(0, 3)
          .map((s) => {
            const nameHtml = s.url
              ? `<a href="${s.url}" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">${s.name}</a>`
              : s.name;
            return `<div style="margin-top:4px;color:#5F5E5A">• ${nameHtml}</div>`;
          })
          .join("");
      }
      panel.innerHTML = html;
    }
  }
})();