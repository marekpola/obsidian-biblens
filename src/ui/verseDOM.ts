import type { VerseEntry } from "../provider";

export function buildVerseDOM(entries: VerseEntry[]): HTMLElement {
  const container = document.createElement('div');
  container.addClass('biblens-verse-content');
  if (entries.length === 0) {
    const em = document.createElement('em');
    em.appendChild(document.createTextNode('Verš nenalezen'));
    container.appendChild(em);
    return container;
  }
  for (const entry of entries) {
    if (container.hasChildNodes()) container.appendChild(document.createTextNode(' '));
    const sup = document.createElement('sup');
    sup.appendChild(document.createTextNode(entry.label));
    container.appendChild(sup);
    container.appendChild(document.createTextNode(' ' + entry.text));
  }
  return container;
}
