export default function resolveAddress(input, config) {
  const text = input.trim();

  if (!text) {
    return config.startPage;
  }

  if (/^https?:\/\//i.test(text)) {
    return new URL(text).href;
  }

  // Never turn javascript:, data:, file:, or browser URLs into navigations.
  if (/^[a-z][a-z\d+.-]*:/i.test(text) && !/^[\w.-]+:\d+(?:\/|$)/.test(text)) {
    throw new Error("Only HTTP and HTTPS addresses are supported");
  }

  if (
    !/\s/.test(text) &&
    /^(localhost|[\w-]+(?:\.[\w-]+)+)(?::\d+)?(?:[/?#]|$)/.test(text)
  ) {
    return new URL(`https://${text}`).href;
  }

  return config.searchUrl + encodeURIComponent(text);
}
