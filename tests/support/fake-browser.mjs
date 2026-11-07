export default function fakeBrowser(historyItems = []) {
  const calls = [];
  const listeners = {};

  return {
    calls,
    listeners,
    runtime: {
      id: "local",
      onMessage: {
        addListener: (listener) => {
          listeners.message = listener;
        },
      },
    },
    windows: {
      create: async (options) => {
        calls.push({
          action: "window",
          ...options,
        });
      },
    },
    tabs: {
      update: async (id, options) => {
        calls.push({
          action: "update",
          id,
          ...options,
        });
      },
      goBack: async (id) => {
        calls.push({
          action: "back",
          id,
        });
      },
      goForward: async (id) => {
        calls.push({
          action: "forward",
          id,
        });
      },
      reload: async (id, options) => {
        calls.push({
          action: "reload",
          id,
          ...options,
        });
      },
    },
    history: {
      async search(query) {
        calls.push({
          action: "history",
          ...query,
        });

        return historyItems;
      },
    },
  };
}
