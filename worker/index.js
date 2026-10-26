const TEXT_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
};

function notFound() {
  return new Response("Not Found", {
    status: 404,
    headers: TEXT_HEADERS,
  });
}

export async function handleRequest(request, env) {
  const url = new URL(request.url);

  if (url.pathname === "/_health" || url.pathname === "/ok") {
    return new Response("OK", { headers: TEXT_HEADERS });
  }

  if (url.pathname === "/") {
    return new Response("OK", { headers: TEXT_HEADERS });
  }

  if (!["GET", "HEAD"].includes(request.method)) {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { ...TEXT_HEADERS, Allow: "GET, HEAD" },
    });
  }

  const acceptsHtml = request.headers.get("Accept")?.includes("text/html") ?? false;
  const match = url.pathname.match(/^\/([a-z0-9]+(?:-[a-z0-9]+)*)(?:\/|$)/);

  if (!acceptsHtml || !match) {
    return env.ASSETS.fetch(request);
  }

  // Fetch the canonical project URL; the asset router resolves its index.html.
  const fallbackUrl = new URL(`/${match[1]}/`, url);
  fallbackUrl.search = url.search;

  const response = await env.ASSETS.fetch(new Request(fallbackUrl, request));
  return response.status === 404 ? notFound() : response;
}

export default {
  fetch: handleRequest,
};
