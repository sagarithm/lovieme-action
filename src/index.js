import * as fs from "node:fs";

function getInput(name, defaultValue = "") {
  const val = process.env[`INPUT_${name.replace(/-/g, "_").toUpperCase()}`];
  return (val !== undefined && val !== null ? val : defaultValue).trim();
}

function setOutput(name, value) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    fs.appendFileSync(outputFile, `${name}=${value}\n`, "utf-8");
  }
  console.log(`[LovieMe Action] Output: ${name}=${value}`);
}

function appendStepSummary(markdown) {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    fs.appendFileSync(summaryFile, `${markdown}\n\n`, "utf-8");
  }
}

async function request(baseUrl, path, apiKey, options = {}) {
  const url = `${baseUrl.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = {
    "Content-Type": "application/json",
    "User-Agent": "LovieMe-PR-Action/0.1.0",
    Authorization: `Bearer ${apiKey}`,
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });
  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const payload = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const errorMsg =
      (typeof payload === "object" && payload !== null && (payload.error || payload.message)) ||
      `HTTP ${res.status}: ${res.statusText}`;
    throw new Error(String(errorMsg));
  }

  return payload;
}

export async function run() {
  const apiKey = getInput("api-key");
  const rawSubdomain = getInput("subdomain");
  const actionInput = getInput("action", "auto").toLowerCase();
  const cnameTarget = getInput("cname-target");
  const preset = getInput("preset");
  const apiUrl = getInput("api-url", "https://www.lovie.me");

  if (!apiKey) {
    throw new Error("Missing required input: api-key");
  }
  if (!rawSubdomain) {
    throw new Error("Missing required input: subdomain");
  }

  const cleanSubdomain = rawSubdomain.replace(/\.lovie\.me$/i, "").trim().toLowerCase();
  const fqdn = `${cleanSubdomain}.lovie.me`;
  const previewUrl = `https://${fqdn}`;

  // Determine action (auto-detect based on PR event if available)
  let mode = actionInput;
  if (mode === "auto") {
    const eventName = process.env.GITHUB_EVENT_NAME || "";
    // If PR event payload has action
    let prAction = "";
    if (process.env.GITHUB_EVENT_PATH && fs.existsSync(process.env.GITHUB_EVENT_PATH)) {
      try {
        const eventData = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf-8"));
        prAction = eventData.action || "";
      } catch {
        // ignore
      }
    }

    if (prAction === "closed") {
      mode = "release";
    } else {
      mode = "claim";
    }
  }

  console.log(`[LovieMe Action] Executing mode: "${mode}" for subdomain: "${cleanSubdomain}"`);

  if (mode === "claim") {
    // 1. Check availability
    const checkRes = await request(apiUrl, `/api/v1/subdomains/check?name=${encodeURIComponent(cleanSubdomain)}`, apiKey);
    
    // 2. Claim if available
    if (checkRes.available) {
      await request(apiUrl, "/api/v1/subdomains", apiKey, {
        method: "POST",
        body: JSON.stringify({ name: cleanSubdomain }),
      });
      console.log(`[LovieMe Action] Successfully claimed: ${fqdn}`);
    } else {
      console.log(`[LovieMe Action] Subdomain already owned or reserved: ${fqdn}`);
    }

    // 3. Apply preset or CNAME if specified
    if (preset) {
      await request(apiUrl, "/api/v1/dns/presets", apiKey, {
        method: "POST",
        body: JSON.stringify({
          subdomain: cleanSubdomain,
          preset,
          customTarget: cnameTarget || undefined,
        }),
      });
      console.log(`[LovieMe Action] Applied preset "${preset}" to ${fqdn}`);
    } else if (cnameTarget) {
      await request(apiUrl, "/api/v1/dns/records", apiKey, {
        method: "POST",
        body: JSON.stringify({
          subdomain: cleanSubdomain,
          type: "CNAME",
          name: "@",
          content: cnameTarget,
          ttl: 300,
        }),
      });
      console.log(`[LovieMe Action] Configured CNAME -> ${cnameTarget}`);
    }

    setOutput("fqdn", fqdn);
    setOutput("status", "claimed");
    setOutput("preview-url", previewUrl);

    appendStepSummary(`### 🌐 LovieMe Preview Subdomain Deployed
- **URL**: [${previewUrl}](${previewUrl})
- **FQDN**: \`${fqdn}\`
- **Anycast Propagation**: < 2 seconds
- **Status**: ✅ Active`);

  } else if (mode === "release" || mode === "delete") {
    // Release subdomain
    await request(apiUrl, `/api/v1/subdomains/${encodeURIComponent(cleanSubdomain)}`, apiKey, {
      method: "DELETE",
    });

    setOutput("fqdn", fqdn);
    setOutput("status", "released");
    setOutput("preview-url", "");

    console.log(`[LovieMe Action] Successfully released ephemeral subdomain: ${fqdn}`);

    appendStepSummary(`### 🧹 LovieMe Preview Subdomain Cleaned Up
- **Released Subdomain**: \`${fqdn}\`
- **DNS Records**: Purged from global Anycast nameservers
- **Status**: 🗑️ Successfully deleted`);
  } else {
    throw new Error(`Unknown action mode: "${mode}". Expected "claim", "release", or "auto".`);
  }
}

// Auto-run if executed directly as GitHub Action
// Auto-run only if executed directly as GitHub Action entrypoint (not when imported in unit tests)
if (process.env.GITHUB_ACTIONS && !process.env.VITEST) {
  run().catch((err) => {
    console.error(::error::\);
    process.exit(1);
  });
}`);
    process.exit(1);
  });
}

