import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { handleRequest } from "../worker/index.js";

const wranglerConfig = JSON.parse(
  await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8"),
);

function mockAssets(resolveAsset) {
  const requested = [];
  return {
    requested,
    binding: {
      fetch: async (request) => {
        const url = new URL(request.url);
        requested.push({ pathname: url.pathname, search: url.search });
        return resolveAsset(url, request);
      },
    },
  };
}

test("the bare smoke URL is routed through the Worker before assets", () => {
  assert.deepEqual(wranglerConfig.assets.run_worker_first, ["/ok"]);
});

test("the smoke URL returns the exact plain-text response", async () => {
  const response = await handleRequest(
    new Request("https://playground.example/ok"),
    {},
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8");
  assert.equal(await response.text(), "OK");
});

test("the root returns the exact plain-text OK response", async () => {
  const response = await handleRequest(
    new Request("https://playground.example/"),
    {},
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8");
  assert.equal(await response.text(), "OK");
});

test("a deep browser route fetches the canonical project URL and keeps the query", async () => {
  const assets = mockAssets((url) =>
    url.pathname === "/pong/"
      ? new Response("Pong app")
      : new Response("Not Found", { status: 404 }),
  );

  const response = await handleRequest(
    new Request("https://playground.example/pong/arena/level-1?seed=42", {
      headers: { Accept: "text/html" },
    }),
    { ASSETS: assets.binding },
  );

  assert.equal(await response.text(), "Pong app");
  assert.deepEqual(assets.requested, [
    { pathname: "/pong/", search: "?seed=42" },
  ]);
});

test("an unknown project route stays a 404", async () => {
  const assets = mockAssets(() => new Response("Not Found", { status: 404 }));

  const response = await handleRequest(
    new Request("https://playground.example/missing/route", {
      headers: { Accept: "text/html" },
    }),
    { ASSETS: assets.binding },
  );

  assert.equal(response.status, 404);
  assert.equal(await response.text(), "Not Found");
});

test("missing non-page assets keep their original path", async () => {
  const assets = mockAssets(() => new Response("Not Found", { status: 404 }));

  const response = await handleRequest(
    new Request("https://playground.example/pong/assets/missing.js", {
      headers: { Accept: "*/*" },
    }),
    { ASSETS: assets.binding },
  );

  assert.equal(response.status, 404);
  assert.deepEqual(assets.requested, [
    { pathname: "/pong/assets/missing.js", search: "" },
  ]);
});

test("unsupported methods are rejected before the asset binding", async () => {
  const assets = mockAssets(() => new Response("unexpected"));

  const response = await handleRequest(
    new Request("https://playground.example/pong/api", { method: "POST" }),
    { ASSETS: assets.binding },
  );

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET, HEAD");
  assert.deepEqual(assets.requested, []);
});
