// Progressive enhancements only; the content remains usable without JavaScript.
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", () => {
    document.documentElement.classList.remove("menu-open");
  });
});

const copyStatus = document.querySelector(".copy-status");

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  // GitHub Pages is secure, but this fallback keeps copying useful on local previews.
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.select();
  const copied = document.execCommand("copy");
  textArea.remove();

  if (!copied) {
    throw new Error("Copy command was rejected");
  }
}

document.querySelectorAll("[data-copy]").forEach((button) => {
  const defaultLabel = button.innerHTML;

  button.addEventListener("click", async () => {
    try {
      await copyText(button.dataset.copy);
      button.textContent = "[ ✓ ] Address copied";
      if (copyStatus) copyStatus.textContent = "Wallet address copied to clipboard.";
    } catch {
      button.textContent = "Copy failed — select the address";
      if (copyStatus) copyStatus.textContent = "Copy failed. Select and copy the address manually.";
    }

    window.setTimeout(() => {
      button.innerHTML = defaultLabel;
      if (copyStatus) copyStatus.textContent = "";
    }, 2200);
  });
});

const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();
