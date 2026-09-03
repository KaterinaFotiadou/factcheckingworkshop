export default async function handler(req, res) {
  // Allow requests from the extension
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { title, excerpt, url } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Missing article title" });
  }

  try {
    const searchResults = await searchSources(title, url);
    const verdict = await evaluateWithLLM(title, excerpt, searchResults);
    const stances = verdict.sourceStances || [];

    return res.status(200).json({
      verdict: verdict.level === "high" ? "agree" : verdict.level === "low" ? "disagree" : "mixed",
      note: verdict.note,
      sources: searchResults.map((s, i) => ({
        name: s.title,
        url: s.url,
        stance: stances[i] || "partial",
        snippet: s.snippet
      }))
    });
  } catch (err) {
    console.error(err);
    return res.status(200).json({
      level: "unclear",
      note: "Check failed due to a technical error"
    });
  }
}

async function searchSources(query, currentPageUrl) {
  // Tavily: free API built for AI/search applications, key from app.tavily.com
  const apiKey = process.env.TAVILY_API_KEY;

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query: query,
      // Ask for a few extra results, in case one must be filtered out below
      max_results: 8
    })
  });
  const data = await response.json();

  let results = (data.results || []).map((item) => ({
    title: item.title,
    snippet: item.content,
    url: item.url
  }));

  // Exclude the article's own domain 
  if (currentPageUrl) {
    try {
      const currentHost = new URL(currentPageUrl).hostname.replace("www.", "");
      results = results.filter((r) => {
        try {
          const resultHost = new URL(r.url).hostname.replace("www.", "");
          return resultHost !== currentHost;
        } catch {
          return true;
        }
      });
    } catch {
      // Invalid URL
    }
  }

  return results.slice(0, 5);
}

async function evaluateWithLLM(title, excerpt, sources) {
  // Groq: free API
  const apiKey = process.env.GROQ_API_KEY;

  const sourcesText = sources
    .map((s, i) => `${i + 1}. ${s.title}: ${s.snippet} (${s.url})`)
    .join("\n");

  const prompt = `Claim / article title: "${title}"
Excerpt: "${excerpt}"

Sources found:
${sourcesText || "No relevant sources found"}

Based EXCLUSIVELY on the sources above, evaluate the claim.
Respond ONLY with JSON in this format:
{
  "level": "high" | "medium" | "low" | "unclear",
  "note": "short explanation in English, max 15 words",
  "sourceStances": ["confirms" | "refutes" | "partial", ...]
}

"sourceStances" must have EXACTLY ${sources.length} items, one per source, in the same order.

Guidelines for level:
- "high": the sources clearly support the claim
- "medium": partial confirmation or unclear picture
- "low": the sources contradict the claim
- "unclear": not enough sources to evaluate

Guidelines for each sourceStance:
- "confirms": this specific source supports the claim
- "refutes": this specific source contradicts the claim
- "partial": this source gives a mixed or not directly relevant picture`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      max_tokens: 1500,
      reasoning_effort: "low",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";

  if (!text) {
    console.error("Empty response from the model. Full raw data:", JSON.stringify(data));
    return { level: "unclear", note: "Empty response received from the model", sourceStances: [] };
  }

  try {
    // Extracts the first {...} object from the response, in case the model
    // adds extra text around it despite the instruction.
    const match = text.match(/\{[\s\S]*\}/);
    const clean = match ? match[0] : text;
    const parsed = JSON.parse(clean);

    return {
      level: parsed.level || "unclear",
      note: parsed.note || "No explanation received",
      sourceStances: Array.isArray(parsed.sourceStances) ? parsed.sourceStances : []
    };
  } catch (err) {
    console.error("Could not parse the LLM response:", text);
    return { level: "unclear", note: "Could not parse the response", sourceStances: [] };
  }
}