// Extraction de texte d'un fichier joint, côté navigateur.
// .txt/.md/.csv/.json : lecture directe ; .docx : mammoth ; .pdf : pdf.js.
// Les libs sont chargées à la volée depuis un CDN (pas de dépendance npm ajoutée).

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (/\.(txt|md|csv|tsv|json)$/.test(name)) {
    return (await file.text()).trim();
  }

  if (name.endsWith('.docx')) {
    const mammothUrl = 'https://esm.sh/mammoth@1.8.0';
    const mammoth: any = await import(/* @vite-ignore */ mammothUrl);
    const { value } = await (mammoth.extractRawText ?? mammoth.default.extractRawText)({ arrayBuffer: await file.arrayBuffer() });
    return String(value ?? '').trim();
  }

  if (name.endsWith('.pdf')) {
    const pdfUrl = 'https://esm.sh/pdfjs-dist@4.6.82/build/pdf.min.mjs';
    const pdfjs: any = await import(/* @vite-ignore */ pdfUrl);
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.6.82/build/pdf.worker.min.mjs';
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    let out = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      out += content.items.map((it: any) => ('str' in it ? it.str : '')).join(' ') + '\n';
    }
    return out.trim();
  }

  throw new Error('Format non supporté — utilise un fichier .txt, .md, .docx ou .pdf.');
}
