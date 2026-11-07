import config from "../config.mjs";
import createHandler from "./create-handler.mjs";
import registerMessageListener from "./register-message-listener.mjs";

registerMessageListener(chrome, createHandler(chrome, config));
