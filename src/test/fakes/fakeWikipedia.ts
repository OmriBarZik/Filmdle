/** What the fake Wikipedia answers, and the pages it was asked for. */
const asked: string[] = [];
const realFetch = window.fetch.bind(window);

/** The pages Wikipedia was asked for since `installFakeWikipedia`, as "lang:Page". */
export function wikipediaRequests(): readonly string[] {
  return asked;
}

/**
 * Answers Wikipedia's page summary requests with a fixed summary, and records them, so
 * tests never reach the network. Everything else goes to the real `fetch`.
 */
export function installFakeWikipedia(): void {
  asked.length = 0;
  window.fetch = (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const match = /^\/api\/rest_v1\/page\/summary\/(.+)$/.exec(url.pathname);
    if (url.hostname.endsWith(".wikipedia.org") && match?.[1]) {
      asked.push(`${url.hostname.split(".")[0]}:${decodeURIComponent(match[1])}`);
      const body = { description: "A test film", extract: "The story of a test film." };
      return Promise.resolve(Response.json(body));
    }
    return realFetch(input, init);
  };
}

export function removeFakeWikipedia(): void {
  window.fetch = realFetch;
}
