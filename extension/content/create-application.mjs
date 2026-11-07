import BrowserClient from "./browser-client.mjs";
import createCommands from "./create-commands.mjs";
import createHintSession from "./hints/create-session.mjs";
import bindings from "./keyboard/bindings.mjs";
import ModeController from "./keyboard/controller.mjs";
import createInsertSession from "./keyboard/insert-session.mjs";
import PromptSession from "./prompt/session.mjs";
import createNotice from "./ui/notice.mjs";

export default function createApplication(runtime, config) {
  const browser = new BrowserClient(runtime);
  const controller = new ModeController({
    bindings,
    onCommand(name) {
      run(commands[name]);
    },
  });
  const showNotice = (text) =>
    controller.activate(() =>
      createNotice({
        text,
        onClose: () => controller.reset(),
      }),
    );
  const run = async (action) => {
    try {
      await action();
    } catch (error) {
      showNotice(error.message);
    }
  };
  const open = (text, target) => {
    controller.reset();
    run(() => browser.open(text, target));
  };
  const commands = createCommands({
    config,
    browser,
    showNotice,
    enterInsert: () => controller.activate(createInsertSession),
    openPrompt: (options) =>
      controller.activate(
        () =>
          new PromptSession({
            ...options,
            searchHistory: (query) => browser.searchHistory(query),
            onSubmit: open,
            onClose: () => controller.reset(),
          }),
      ),
    startHints(target) {
      const session = controller.activate(() =>
        createHintSession({
          target,
          alphabet: config.hintKeys,
          onClose: () => controller.reset(),
          onOpen: open,
        }),
      );

      if (!session) {
        showNotice("No visible hint targets in this frame");
      }
    },
  });

  return controller;
}
