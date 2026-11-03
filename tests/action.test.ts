import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { run } from "../src/index.js";

describe("LovieMe GitHub Action", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("should throw if api-key is missing", async () => {
    process.env.INPUT_SUBDOMAIN = "pr-12-myapp";
    delete process.env.INPUT_API_KEY;

    await expect(run()).rejects.toThrow("Missing required input: api-key");
  });

  it("should throw if subdomain is missing", async () => {
    process.env.INPUT_API_KEY = "lovie_live_dummy";
    delete process.env.INPUT_SUBDOMAIN;

    await expect(run()).rejects.toThrow("Missing required input: subdomain");
  });

  it("should claim subdomain and configure CNAME when mode is claim", async () => {
    process.env.INPUT_API_KEY = "lovie_live_dummy";
    process.env.INPUT_SUBDOMAIN = "pr-42-test";
    process.env.INPUT_ACTION = "claim";
    process.env.INPUT_CNAME_TARGET = "cname.vercel-dns.com";

    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation(async (url, init) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/v1/subdomains/check")) {
        return new Response(JSON.stringify({ available: true, fqdn: "pr-42-test.lovie.me" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (urlStr.includes("/api/v1/subdomains") && init?.method === "POST") {
        return new Response(JSON.stringify({ success: true, subdomain: { name: "pr-42-test" } }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (urlStr.includes("/api/v1/dns/records") && init?.method === "POST") {
        return new Response(JSON.stringify({ success: true, record: { id: "rec-1" } }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("Not Found", { status: 404 });
    });

    await expect(run()).resolves.toBeUndefined();
    expect(fetchSpy).toHaveBeenCalled();
  });

  it("should release subdomain when mode is release", async () => {
    process.env.INPUT_API_KEY = "lovie_live_dummy";
    process.env.INPUT_SUBDOMAIN = "pr-42-test";
    process.env.INPUT_ACTION = "release";

    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation(async (url, init) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/v1/subdomains/pr-42-test") && init?.method === "DELETE") {
        return new Response(JSON.stringify({ success: true, message: "Released" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("Not Found", { status: 404 });
    });

    await expect(run()).resolves.toBeUndefined();
    expect(fetchSpy).toHaveBeenCalled();
  });
});

