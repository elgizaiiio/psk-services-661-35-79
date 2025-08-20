// Utility to reliably download or share an image across browsers and in-app webviews
export async function downloadImage(imageSrc: string, filename: string): Promise<{ ok: boolean; method: "download" | "share" | "open"; message?: string }>{
  try {
    // Prefer converting to a Blob for consistent behavior
    let blob: Blob | null = null;

    if (imageSrc.startsWith("data:")) {
      // Convert data URL to Blob via fetch for simplicity
      const res = await fetch(imageSrc);
      blob = await res.blob();
    } else {
      // Try fetching the image. If CORS blocks it, we'll fallback to open.
      try {
        const res = await fetch(imageSrc, { mode: "cors", credentials: "omit" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        blob = await res.blob();
      } catch {
        // If fetch fails (CORS or network), fallback to opening the URL
        // In many in-app browsers (e.g., Telegram), direct downloads are blocked.
        // Opening allows users to long-press/save.
        window.open(imageSrc, "_blank", "noopener,noreferrer");
        return { ok: true, method: "open", message: "Opened image in a new tab." };
      }
    }

    if (!blob) throw new Error("Failed to prepare image blob");

    // Try Web Share API (best UX on mobile/in-app browsers)
    try {
      const file = new File([blob], filename, { type: blob.type || "image/jpeg" });
      // @ts-ignore - optional chaining for canShare
      if (navigator?.canShare?.({ files: [file] })) {
        // @ts-ignore - share may not exist on all platforms
        await navigator.share({ files: [file], title: filename, text: "AI generated image" });
        return { ok: true, method: "share" };
      }
    } catch {
      // Ignore and fallback to classic download
    }

    // Classic anchor download with object URL
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 200);

    return { ok: true, method: "download" };
  } catch (e: any) {
    // Final fallback: try opening the original URL
    try {
      window.open(imageSrc, "_blank", "noopener,noreferrer");
      return { ok: true, method: "open", message: e?.message };
    } catch {
      return { ok: false, method: "open", message: e?.message };
    }
  }
}
