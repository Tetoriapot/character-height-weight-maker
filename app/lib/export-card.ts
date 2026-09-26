/** Inline resolved SVG paint so html2canvas can rasterize external CSS and theme variables. */
async function inlineSvgImages(root: HTMLElement, doc: Document) {
  // html2canvas freezes every SVG computed style while cloning. Release those
  // copies so export width and transparent-theme overrides can take effect.
  root.querySelectorAll("svg, svg *").forEach((node) => node.removeAttribute("style"));
  const properties = ["fill", "fill-opacity", "stroke", "stroke-width", "stroke-opacity", "stroke-linecap", "stroke-linejoin", "stroke-dasharray", "font-family", "font-size", "font-weight", "text-anchor", "opacity", "stop-color", "stop-opacity", "display"];
  for (const source of Array.from(root.querySelectorAll("svg"))) {
    const bounds = source.getBoundingClientRect();
    if (!bounds.width || !bounds.height) continue;
    const copy = source.cloneNode(true) as SVGSVGElement;
    const sourceNodes = [source, ...Array.from(source.querySelectorAll("*"))];
    const copyNodes = [copy, ...Array.from(copy.querySelectorAll("*"))];
    sourceNodes.forEach((node, i) => {
      const computed = doc.defaultView!.getComputedStyle(node);
      const target = copyNodes[i] as SVGElement;
      for (const prop of properties) {
        const value = computed.getPropertyValue(prop).replace(/url\(["']?[^)"']*#([^)'"\s]+)["']?\)/g, "url(#$1)");
        target.style.setProperty(prop, value);
      }
    });
    copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    copy.setAttribute("width", String(bounds.width));
    copy.setAttribute("height", String(bounds.height));
    const img = doc.createElement("img");
    img.alt = source.getAttribute("aria-label") ?? "";
    img.style.cssText = `display:block;width:${bounds.width}px;height:${bounds.height}px;max-width:100%`;
    const loaded = new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(new Error("比較図の画像化に失敗しました。")); });
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(copy))}`;
    source.replaceWith(img);
    await loaded;
  }
}

export async function exportCard(element: HTMLElement, transparent: boolean) {
  const { default: html2canvas } = await import("html2canvas");
  await document.fonts.ready;
  return html2canvas(element, {
    backgroundColor: null,
    scale: 2,
    windowWidth: 1200,
    scrollX: 0,
    scrollY: 0,
    logging: false,
    onclone: async (doc) => {
      const card = doc.getElementById(element.id);
      if (!card) throw new Error("保存対象が見つかりません。");
      card.style.width = "900px";
      card.style.maxWidth = "none";
      card.style.minWidth = "900px";
      card.style.margin = "0";
      card.style.boxShadow = "none";
      if (transparent) {
        card.classList.add("export-transparent");
        card.style.background = "transparent";
        card.style.borderColor = "transparent";
      }
      await inlineSvgImages(card, doc);
    },
  });
}

export async function downloadCard(element: HTMLElement, transparent: boolean, name: string) {
  const canvas = await exportCard(element, transparent);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error("画像を作成できませんでした。")), "image/png"));
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = `${name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").slice(0, 80)}${transparent ? "-transparent" : ""}.png`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}
