(() => {
  let mode = "normal";
  let prefix = "";
  let prefixTimer;
  let overlay;
  let hints = [];
  let hintInput = "";
  let hintNewWindow = false;

  function dismiss() {
    overlay?.remove();
    overlay = undefined;
    hints = [];
    hintInput = "";
    mode = "normal";
    prefix = "";
    clearTimeout(prefixTimer);
  }

  function surface() {
    dismiss();
    overlay = document.createElement("div");
    overlay.style.cssText =
      "all:initial!important;position:fixed!important;inset:0!important;z-index:2147483647!important;pointer-events:none!important";
    const root = overlay.attachShadow({
      mode: "closed",
    });
    const style = document.createElement("style");
    style.textContent = `
      * { box-sizing: border-box; font: 16px monospace; }
      .bar { position: fixed; bottom: 0; left: 0; width: 100%; padding: 10px;
        color: #eee; background: #222; border-top: 2px solid #d8a657;
        pointer-events: auto; }
      input { width: 100%; background: #222; color: #eee; border: 0; outline: none; }
      .label { position: fixed; background: #ffe082; color: #111; font-weight: bold;
        border: 1px solid #222; padding: 1px 3px; border-radius: 2px; }
      .label .matched { font: inherit; color: #16752b; }
    `;
    root.append(style);
    document.documentElement.append(overlay);
    return root;
  }

  function notice(text) {
    const root = surface();
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.textContent = text;
    root.append(bar);
    const current = overlay;
    setTimeout(() => {
      if (overlay === current) dismiss();
    }, 4000);
  }

  async function send(message) {
    try {
      const result = await chrome.runtime.sendMessage(message);
      if (result?.error) notice(result.error);
    } catch (error) {
      notice(`Reload this page to reconnect the extension: ${error.message}`);
    }
  }

  function prompt(initial = "", newWindow = false, select = true) {
    const root = surface();
    mode = "prompt";
    const bar = document.createElement("div");
    bar.className = "bar";
    const input = document.createElement("input");
    input.setAttribute(
      "aria-label",
      newWindow ? "Open in new window" : "Open address or search",
    );
    input.placeholder = newWindow
      ? "Open in new window…"
      : "Open address or search…";
    input.value = initial;
    bar.append(input);
    root.append(bar);
    input.addEventListener("keydown", (event) => {
      if (!event.isTrusted) return;
      event.stopPropagation();
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss();
      } else if (event.key === "Enter") {
        event.preventDefault();
        const text = input.value;
        dismiss();
        send({
          action: "open",
          text,
          newWindow,
        });
      }
    });
    input.focus();
    if (select) input.select();
    else input.setSelectionRange(initial.length, initial.length);
  }

  function editable(event) {
    return event
      .composedPath()
      .some(
        (node) =>
          node instanceof Element &&
          (node.matches("input,textarea,select,[role=textbox]") ||
            node.isContentEditable),
      );
  }

  function elements(root = document) {
    const result = [
      ...root.querySelectorAll(
        "a[href],button,input:not([type=hidden]),textarea,select,[role=button],[role=link],[tabindex]",
      ),
    ];
    for (const element of root.querySelectorAll("*")) {
      if (element.shadowRoot) result.push(...elements(element.shadowRoot));
    }
    return result;
  }

  function startHints(newWindow) {
    const candidates = elements().filter((element) => {
      if (element.disabled || element.closest("[inert]")) return false;
      if (newWindow && !element.matches("a[href]")) return false;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < innerHeight &&
        rect.left < innerWidth &&
        style.visibility === "visible" &&
        style.display !== "none"
      );
    });
    if (!candidates.length)
      return notice("No visible hint targets in this frame");
    const root = surface();
    mode = "hints";
    hintNewWindow = newWindow;
    const alphabet = browserConfig.hintKeys;
    const width = Math.max(
      1,
      Math.ceil(Math.log(candidates.length) / Math.log(alphabet.length)),
    );
    hints = candidates.map((element, index) => {
      let code = "";
      for (let digit = 0; digit < width; digit++) {
        code = alphabet[index % alphabet.length] + code;
        index = Math.floor(index / alphabet.length);
      }
      const rect = element.getBoundingClientRect();
      const label = document.createElement("span");
      label.className = "label";
      const matched = document.createElement("span");
      matched.className = "matched";
      const remaining = document.createTextNode(code);
      label.append(matched, remaining);
      label.style.left = `${Math.max(0, rect.left)}px`;
      label.style.top = `${Math.max(0, rect.top)}px`;
      root.append(label);
      return {
        element,
        label,
        code,
        matched,
        remaining,
      };
    });
  }

  function hintKey(key) {
    if (key === "Backspace") hintInput = hintInput.slice(0, -1);
    else if (browserConfig.hintKeys.includes(key) && key.length === 1)
      hintInput += key;
    else return;
    const matches = hints.filter(({ code, label, matched, remaining }) => {
      const match = code.startsWith(hintInput);
      label.hidden = !match;
      if (match) {
        matched.textContent = code.slice(0, hintInput.length);
        remaining.data = code.slice(hintInput.length);
      }
      return match;
    });
    if (!matches.length) return dismiss();
    const match = matches.find(({ code }) => code === hintInput);
    if (!match) return;
    const { element } = match;
    const newWindow = hintNewWindow;
    dismiss();
    if (newWindow)
      send({
        action: "open",
        text: element.href,
        newWindow: true,
      });
    else {
      element.focus();
      element.click();
    }
  }

  function scrollTarget() {
    let element = document.activeElement;
    while (element && element !== document.body) {
      if (
        element.scrollHeight > element.clientHeight &&
        /auto|scroll/.test(getComputedStyle(element).overflowY)
      )
        return element;
      element = element.parentElement;
    }
    return document.scrollingElement;
  }

  function scroll(x, y, pages = false) {
    const target = scrollTarget();
    target?.scrollBy({
      left: x,
      top: y * (pages ? target.clientHeight : 1),
      behavior: "instant",
    });
  }

  function copyUrl() {
    const input = document.createElement("textarea");
    input.value = location.href;
    input.style.cssText = "position:fixed;opacity:0";
    document.documentElement.append(input);
    input.select();
    const copied = document.execCommand("copy");
    input.remove();
    notice(copied ? "URL copied" : "Could not copy URL");
  }

  document.addEventListener(
    "keydown",
    (event) => {
      if (!event.isTrusted || event.isComposing) return;
      if (mode === "prompt") return;
      if (event.key === "Escape") {
        const handled = mode !== "normal" || prefix;
        dismiss();
        if (editable(event)) document.activeElement?.blur();
        if (handled) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
        return;
      }
      if (mode === "insert" || editable(event) || event.altKey || event.metaKey)
        return;
      if (mode === "hints") {
        if (event.ctrlKey) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        hintKey(event.key);
        return;
      }
      let action;
      if (event.ctrlKey) {
        if (event.key === "d") action = () => scroll(0, 0.5, true);
        if (event.key === "u") action = () => scroll(0, -0.5, true);
      } else {
        const key = prefix + event.key;
        prefix = "";
        clearTimeout(prefixTimer);
        const step = browserConfig.scrollStep;
        const actions = {
          j: () => scroll(0, step),
          k: () => scroll(0, -step),
          h: () => scroll(-step, 0),
          l: () => scroll(step, 0),
          J: () => scroll(0, 1, true),
          K: () => scroll(0, -1, true),
          gg: () =>
            scrollTarget()?.scrollTo({
              top: 0,
              behavior: "instant",
            }),
          G: () =>
            scrollTarget()?.scrollTo({
              top: scrollTarget().scrollHeight,
              behavior: "instant",
            }),
          H: () =>
            send({
              action: "back",
            }),
          L: () =>
            send({
              action: "forward",
            }),
          r: () =>
            send({
              action: "reload",
            }),
          R: () =>
            send({
              action: "reload",
              hard: true,
            }),
          f: () => startHints(false),
          F: () => startHints(true),
          o: () => prompt(),
          O: () => prompt("", true),
          d: () => prompt(location.href),
          u: () => prompt("!", false, false),
          yy: copyUrl,
          i: () => {
            mode = "insert";
          },
          "?": () =>
            notice(
              "j/k/h/l scroll · J/K page · gg/G top/bottom · f/F hints · o/O open · d edit URL · H/L history · r/R reload · yy copy · i insert · Esc normal",
            ),
        };
        action = actions[key];
        if (!action && (key === "g" || key === "y")) {
          action = () => {
            prefix = key;
            prefixTimer = setTimeout(() => {
              prefix = "";
            }, 1000);
          };
        }
      }
      if (!action) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      action();
    },
    true,
  );

  addEventListener("blur", () => {
    if (mode !== "prompt") dismiss();
  });
  addEventListener("resize", () => {
    if (mode === "hints") dismiss();
  });
  addEventListener(
    "scroll",
    () => {
      if (mode === "hints") dismiss();
    },
    true,
  );
})();
