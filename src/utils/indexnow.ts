/**
 * IndexNow — instantly notify Bing, Yahoo, Yandex, Seznam, etc.
 * (and Google via the IndexNow consortium) about new or updated URLs.
 *
 * Key file: public/7cbd51f34e8c7e662e24e4931b85c0f5.txt
 * Endpoint docs: https://www.indexnow.org/documentation
 */

const INDEXNOW_KEY = "7cbd51f34e8c7e662e24e4931b85c0f5";
const HOST = "optirfp.ai";
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

/**
 * Submit one or more absolute URLs to IndexNow.
 * Fire-and-forget — errors are swallowed so they never break the caller.
 */
export async function submitToIndexNow(urls: string | string[]): Promise<void> {
  const urlList = (Array.isArray(urls) ? urls : [urls]).filter(Boolean);
  if (urlList.length === 0) return;

  try {
    await fetch(ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: KEY_LOCATION,
        urlList,
      }),
    });
  } catch {
    // Non-blocking — search engines will discover via sitemap eventually.
  }
}
