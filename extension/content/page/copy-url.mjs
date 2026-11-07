export default function copyUrl() {
  const input = document.createElement("textarea");

  input.value = location.href;
  input.style.cssText = "opacity: 0; position: fixed";

  document.documentElement.append(input);

  try {
    input.select();

    return document.execCommand("copy");
  } finally {
    input.remove();
  }
}
