import config from "../config.mjs";
import createHandler from "./create-handler.mjs";
import registerListeners from "./register-listeners.mjs";

registerListeners(chrome, createHandler(chrome, config), config.startPage);
