export default function validateSender(sender, extensionId) {
  if (
    sender?.id !== extensionId ||
    !Number.isInteger(sender.tab?.id) ||
    !/^https?:\/\//.test(sender.url || "")
  ) {
    throw new Error("Unsupported sender");
  }
}
