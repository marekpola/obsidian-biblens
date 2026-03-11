import type { VerseEntry } from "../provider";

export type TranslationBlock = { abbreviation: string; entries: VerseEntry[] };

export function buildMultiTranslationDOM(blocks: TranslationBlock[], forceStacked = false): HTMLElement {
  const container = document.createElement('div');
  container.addClass('biblens-verse-content');

  const hasCrossChapter = blocks.some(b => b.entries.some(e => e.chapterBreak));
  const hasMultiEntry = blocks.some(b => b.entries.length > 1);
  const usePaged = !forceStacked && hasMultiEntry && hasCrossChapter;

  if (usePaged) {
    let currentPage = 0;
    const pages: HTMLElement[] = [];

    for (const block of blocks) {
      const page = document.createElement('div');
      page.addClass('biblens-multi-page');

      const heading = document.createElement('div');
      heading.addClass('biblens-multi-abbr');
      heading.textContent = block.abbreviation;
      page.appendChild(heading);

      if (block.entries.length > 0) {
        page.appendChild(buildVerseDOM(block.entries));
      }

      pages.push(page);
      container.appendChild(page);
    }

    const nav = document.createElement('div');
    nav.addClass('biblens-multi-nav');

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '←';
    prevBtn.addClass('biblens-multi-prev');

    const nextBtn = document.createElement('button');
    nextBtn.textContent = '→';
    nextBtn.addClass('biblens-multi-next');

    const showPage = (idx: number) => {
      pages.forEach((p, i) => { p.style.display = i === idx ? '' : 'none'; });
      prevBtn.disabled = idx === 0;
      nextBtn.disabled = idx === pages.length - 1;
      currentPage = idx;
    };

    prevBtn.addEventListener('click', () => { showPage(currentPage - 1); });
    nextBtn.addEventListener('click', () => { showPage(currentPage + 1); });

    nav.appendChild(prevBtn);
    nav.appendChild(nextBtn);
    container.insertBefore(nav, container.firstChild);

    showPage(0);
  } else {
    // Stacked layout
    let first = true;
    for (const block of blocks) {
      if (!first) {
        container.appendChild(document.createElement('hr'));
      }
      first = false;

      if (block.entries.length === 0) {
        const abbr = document.createElement('sup');
        abbr.textContent = block.abbreviation;
        container.appendChild(abbr);
        continue;
      }

      const line = document.createElement('div');
      const firstEntry = block.entries[0]!;
      const abbrSup = document.createElement('sup');
      abbrSup.textContent = `${block.abbreviation} ${firstEntry.label}`;
      line.appendChild(abbrSup);
      line.appendChild(document.createTextNode(' ' + firstEntry.text));

      for (let i = 1; i < block.entries.length; i++) {
        const e = block.entries[i]!;
        if (e.chapterBreak) {
          line.appendChild(document.createElement('br'));
        } else {
          line.appendChild(document.createTextNode(' '));
        }
        const sup = document.createElement('sup');
        sup.textContent = e.label;
        line.appendChild(sup);
        line.appendChild(document.createTextNode(' ' + e.text));
      }

      container.appendChild(line);
    }
  }

  return container;
}

export function buildVerseDOM(entries: VerseEntry[]): HTMLElement {
  const container = document.createElement('div');
  container.addClass('biblens-verse-content');
  if (entries.length === 0) {
    const em = document.createElement('em');
    em.appendChild(document.createTextNode('Verse not found.'));
    container.appendChild(em);
    return container;
  }
  for (const entry of entries) {
    if (container.hasChildNodes()) {
      if (entry.chapterBreak) {
        container.appendChild(document.createElement('br'));
      } else {
        container.appendChild(document.createTextNode(' '));
      }
    }
    const sup = document.createElement('sup');
    sup.appendChild(document.createTextNode(entry.label));
    container.appendChild(sup);
    container.appendChild(document.createTextNode(' ' + entry.text));
  }
  return container;
}
