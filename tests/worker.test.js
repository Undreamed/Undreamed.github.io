import assert from "node:assert/strict";
import { test } from "node:test";
import { handleRequest } from "../worker/index.js";

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

test("the smoke URL returns the exact plain-text response", async () => {
  const response = await handleRequest(
    new Request("https://playground.example/ok"),
    {},
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8");
  assert.equal(await response.text(), "OK");
});

test("the root redirects to the smoke project", async () => {
  const response = await handleRequest(
    new Request("https://playground.example/"),
    {},
  );

  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "https://playground.example/ok/");
});

test("a deep browser route serves its project's index and keeps the query", async () => {
  const assets = mockAssets((url) =>
    url.pathname === "/pong/index.html"
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
    { pathname: "/pong/index.html", search: "?seed=42" },
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
