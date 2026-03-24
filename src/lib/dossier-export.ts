/**
 * PDF export for scam dossier — generates a printable document
 * suitable for filing a police report (Polizia Postale).
 *
 * Uses jsPDF for client-side PDF generation (no server needed).
 */

import type { DossierData } from '@/types/dossier';

const MARGIN_LEFT = 20;
const MARGIN_RIGHT = 20;
const PAGE_WIDTH = 210; // A4 mm
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const LINE_HEIGHT = 7;

/** URL for filing online reports */
const POLIZIA_POSTALE_URL = 'https://www.commissariatodips.it/';

/**
 * Generate and download a PDF dossier for police reporting.
 * jsPDF is dynamically imported to avoid bundling ~300KB in the main chunk.
 */
export async function exportDossierPdf(dossier: DossierData): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 20;

  function checkPageBreak(needed: number) {
    if (y + needed > 275) {
      doc.addPage();
      y = 20;
    }
  }

  function addSection(title: string) {
    checkPageBreak(20);
    y += 4;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(title, MARGIN_LEFT, y);
    y += 2;
    doc.setDrawColor(100, 200, 220);
    doc.setLineWidth(0.5);
    doc.line(MARGIN_LEFT, y, MARGIN_LEFT + CONTENT_WIDTH, y);
    y += LINE_HEIGHT;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
  }

  function addField(label: string, value: string) {
    if (!value.trim()) return;
    checkPageBreak(LINE_HEIGHT * 2);
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, MARGIN_LEFT, y);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(value, CONTENT_WIDTH - 2);
    doc.text(lines as string[], MARGIN_LEFT + 2, y + LINE_HEIGHT);
    y += LINE_HEIGHT * (1 + (lines as string[]).length);
  }

  function addMultiline(label: string, value: string) {
    if (!value.trim()) return;
    checkPageBreak(LINE_HEIGHT * 3);
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, MARGIN_LEFT, y);
    y += LINE_HEIGHT;
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(value, CONTENT_WIDTH);
    for (const line of lines as string[]) {
      checkPageBreak(LINE_HEIGHT);
      doc.text(line, MARGIN_LEFT + 2, y);
      y += LINE_HEIGHT;
    }
  }

  // --- Header ---
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text('DOSSIER TRUFFA — CYBERPEDIA', MARGIN_LEFT, y);
  y += 10;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(`Generato il: ${new Date().toLocaleString('it-IT')}`, MARGIN_LEFT, y);
  y += 5;
  doc.text('Documento generato da Cyberpedia Anti-Truffa Tool — https://cyberpedia.it', MARGIN_LEFT, y);
  y += 3;
  doc.setTextColor(60, 60, 60);

  // --- Identita truffatore ---
  addSection('Identita del truffatore');
  addField('Nome / nickname', dossier.scammerName);

  if (dossier.scammerContacts.length > 0) {
    checkPageBreak(LINE_HEIGHT * (dossier.scammerContacts.length + 1));
    doc.setFont('helvetica', 'bold');
    doc.text('Contatti usati:', MARGIN_LEFT, y);
    y += LINE_HEIGHT;
    doc.setFont('helvetica', 'normal');
    for (const c of dossier.scammerContacts) {
      const typeLabel = c.type === 'phone' ? 'Tel' : c.type === 'email' ? 'Email' : c.type === 'social' ? 'Social' : 'Altro';
      doc.text(`  - ${typeLabel}: ${c.value}${c.label ? ` (${c.label})` : ''}`, MARGIN_LEFT + 2, y);
      y += LINE_HEIGHT;
    }
  }

  // --- Dettagli ---
  addSection('Dettagli');
  addMultiline('Date importanti', dossier.dates);
  addMultiline('Importi coinvolti', dossier.amounts);
  addMultiline('Note e conversazioni', dossier.notes);

  // --- Screenshots ---
  if (dossier.screenshots.length > 0) {
    addSection(`Prove fotografiche (${dossier.screenshots.length})`);

    for (const screenshot of dossier.screenshots) {
      checkPageBreak(100);
      try {
        // jsPDF addImage handles data URIs directly
        const imgWidth = CONTENT_WIDTH * 0.8;
        const imgHeight = imgWidth * 0.75; // approximate aspect ratio
        doc.addImage(screenshot.dataUri, 'JPEG', MARGIN_LEFT, y, imgWidth, imgHeight);
        y += imgHeight + 3;
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(`File: ${screenshot.filename} — Aggiunto: ${new Date(screenshot.addedAt).toLocaleString('it-IT')}`, MARGIN_LEFT, y);
        y += LINE_HEIGHT;
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
      } catch {
        doc.text(`[Immagine non inseribile: ${screenshot.filename}]`, MARGIN_LEFT, y);
        y += LINE_HEIGHT;
      }
    }
  }

  // --- Istruzioni ---
  addSection('Come procedere');
  const instructions = [
    '1. Conserva questo documento in un luogo sicuro.',
    '2. Sporgi denuncia presso la Polizia Postale piu vicina.',
    `3. Puoi anche segnalare online: ${POLIZIA_POSTALE_URL}`,
    '4. Porta con te questo PDF e, se possibile, il dispositivo con le prove originali.',
    '5. Non cancellare messaggi, email o chat con il truffatore — sono prove.',
    '6. Se hai effettuato pagamenti, contatta immediatamente la tua banca.',
  ];
  for (const line of instructions) {
    checkPageBreak(LINE_HEIGHT);
    doc.text(line, MARGIN_LEFT, y);
    y += LINE_HEIGHT;
  }

  // --- Footer ---
  checkPageBreak(20);
  y += 8;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    'Questo documento e stato generato localmente sul dispositivo dell\'utente. Nessun dato e stato trasmesso online.',
    MARGIN_LEFT,
    y,
  );

  // Download
  doc.save(`dossier-truffa-${new Date().toISOString().slice(0, 10)}.pdf`);
}
