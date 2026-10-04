/** Copy text, including in embedded pages without Clipboard API permission. */
export async function copyText(text: string): Promise<void> {
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return;
        }
    } catch {
        // The host iframe may deny the Clipboard API. Try selection-based copy.
    }

    const focusedElement = document.activeElement;
    const selection = document.getSelection();
    const ranges = selection
        ? Array.from({ length: selection.rangeCount }, (_, index) =>
              selection.getRangeAt(index).cloneRange(),
          )
        : [];
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.readOnly = true;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);

    try {
        textarea.focus({ preventScroll: true });
        textarea.select();
        if (!document.execCommand("copy")) {
            throw new Error("Clipboard access is unavailable.");
        }
    } finally {
        textarea.remove();
        if (focusedElement instanceof HTMLElement) {
            focusedElement.focus({ preventScroll: true });
        }
        if (selection) {
            selection.removeAllRanges();
            for (const range of ranges) selection.addRange(range);
        }
    }
}
