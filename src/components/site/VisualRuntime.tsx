import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useSite } from "@/lib/site-content";
import { validImage, validSelector, visualDeclarations, type VisualElement } from "@/lib/visual-editor";

const ELEMENTS = "header,footer,main,section,nav,h1,h2,h3,h4,p,span,a,button,label,img,div,ul,li";

export function VisualRuntime() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const { s } = useSite();
  useEffect(() => {
    if (path.startsWith("/admin")) return;
    const editor = new URLSearchParams(location.search).get("visualEditor") === "1" && window.parent !== window;
    let editing = editor;
    let values = s.visual?.[path] ?? {};
    const originals = new Map<Element, { text: string | null; image: string | null }>();
    const originalDisplays = new Map<Element, string>();
    const sheet = document.createElement("style");
    sheet.dataset.visualSheet = "true";
    document.head.append(sheet);
    const identify = (el: Element): string => {
      if (el.getAttribute("data-visual-id")) return el.getAttribute("data-visual-id") ?? "";
      const parent = el.parentElement;
      if (!parent || parent === document.body) return "page";
      const siblings = [...parent.children].filter((node) => node.tagName === el.tagName);
      return `${identify(parent)}-${el.tagName.toLowerCase()}-${siblings.indexOf(el)}`;
    };
    let observer: MutationObserver;
    const apply = () => {
      observer?.disconnect();
      const elements = document.querySelectorAll(ELEMENTS);
      for (const el of elements) {
        if (el.closest("[data-sonner-toaster]")) continue;
        if (!el.hasAttribute("data-visual-id")) el.setAttribute("data-visual-id", identify(el));
      }
      const rules: string[] = [];
      for (const [selector, value] of Object.entries(values)) {
        if (!validSelector(selector)) continue;
        const el = document.querySelector(selector);
        if (!el) continue;
        rules.push(`${selector}{${visualDeclarations(value)}}`);
        if (value.order !== undefined && el.parentElement) {
          const parent = el.parentElement;
          if (!originalDisplays.has(parent)) originalDisplays.set(parent, getComputedStyle(parent).display);
          const display = originalDisplays.get(parent) ?? "block";
          if (!display.includes("flex") && !display.includes("grid")) {
            rules.push(`[data-visual-id="${parent.getAttribute("data-visual-id")}"]{display:flex;flex-direction:column}`);
          }
        }
        const textNodes = [...el.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
        if (!originals.has(el)) originals.set(el, { text: textNodes[0]?.textContent ?? null, image: el.getAttribute("src") });
        if (typeof value.text === "string" && textNodes.length === 1) textNodes[0].textContent = value.text;
        if (el instanceof HTMLImageElement && validImage(value.image)) el.src = value.image ?? "";
      }
      for (const [el, original] of originals) {
        const selector = `[data-visual-id="${el.getAttribute("data-visual-id")}"]`;
        if (values[selector]?.text === undefined && original.text !== null) {
          const node = [...el.childNodes].find((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
          if (node) node.textContent = original.text;
        }
        if (values[selector]?.image === undefined && original.image && el instanceof HTMLImageElement) el.src = original.image;
      }
      sheet.textContent = rules.join("\n");
      observer?.observe(document.body, { subtree: true, childList: true, characterData: true });
    };
    observer = new MutationObserver(apply);
    apply();
    const select = (target: Element) => {
      document.querySelectorAll(".visual-selected").forEach((el) => el.classList.remove("visual-selected"));
      target.classList.add("visual-selected");
      const nodes = [...target.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
      const style = getComputedStyle(target);
      window.parent.postMessage({ type: "visual-selected", path, selector: `[data-visual-id="${target.getAttribute("data-visual-id")}"]`, tag: target.tagName.toLowerCase(), text: nodes.length === 1 ? nodes[0].textContent : null, image: target instanceof HTMLImageElement ? target.src : null, size: parseFloat(style.fontSize), parent: target.parentElement?.getAttribute("data-visual-id"), siblings: [...(target.parentElement?.children ?? [])].map((el) => ({ selector: `[data-visual-id="${el.getAttribute("data-visual-id")}"]`, label: el.tagName.toLowerCase() + " · " + (el.textContent ?? "").trim().slice(0, 45) })) }, location.origin);
    };
    const click = (event: MouseEvent) => {
      if (!editing) return;
      const target = event.target instanceof Element ? event.target.closest(ELEMENTS) : null;
      if (!target) return;
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
      select(target);
    };
    const message = (event: MessageEvent) => {
      if (!editor || event.origin !== location.origin || event.source !== window.parent) return;
      if (event.data?.type === "visual-draft") { values = event.data.values as Record<string, VisualElement>; apply(); }
      if (event.data?.type === "visual-mode") editing = !!event.data.editing;
      if (event.data?.type === "visual-select" && validSelector(event.data.selector)) {
        const target = document.querySelector(event.data.selector);
        if (target) { target.scrollIntoView({ block: "center" }); select(target); }
      }
    };
    if (editor) {
      window.addEventListener("message", message);
      document.addEventListener("click", click, true);
      const sections = [...document.querySelectorAll("main > section, header, footer")].map((el) => ({ selector: `[data-visual-id="${el.getAttribute("data-visual-id")}"]`, label: el.tagName === "HEADER" ? "Topo" : el.tagName === "FOOTER" ? "Rodapé" : el.querySelector("h1,h2,h3")?.textContent ?? el.getAttribute("aria-label") ?? "Seção" }));
      window.parent.postMessage({ type: "visual-ready", path, sections }, location.origin);
    }
    return () => { observer.disconnect(); sheet.remove(); window.removeEventListener("message", message); document.removeEventListener("click", click, true); };
  }, [path, s.visual]);
  return null;
}