// =============================================================================
// Upload Tool File Parser
// Extracts readable text content from uploaded files for AI analysis.
// Supports: PDF (text-layer), DOCX, XLSX, XER (Primavera P6), XML (MSP/Asta)
//
// Note: PDF extraction uses basic text parsing. For scanned PDFs (image-only),
// the extractor returns a notice — users should export text-layer PDFs.
// =============================================================================

import ExcelJS from 'exceljs';

// ─── PDF text extraction ──────────────────────────────────────────────────────
// We use a lightweight regex approach on the raw PDF buffer to extract text
// streams without requiring pdf-parse (which has Node.js compatibility issues
// on Vercel Edge). For proper text-layer PDFs this works well.

function extractTextFromPdfBuffer(buffer: Buffer): string {
  const raw = buffer.toString('latin1');
  const lines: string[] = [];

  // Extract text between BT (begin text) and ET (end text) markers
  const btEtRegex = /BT([\s\S]*?)ET/g;
  let btMatch: RegExpExecArray | null;

  while ((btMatch = btEtRegex.exec(raw)) !== null) {
    const block = btMatch[1];
    // Match Tj, TJ, ' operators
    const textRegex = /\(((?:[^()\\]|\\.)*)\)\s*(?:Tj|'|")|(\[(?:[^\]]*)\])\s*TJ/g;
    let tMatch: RegExpExecArray | null;
    while ((tMatch = textRegex.exec(block)) !== null) {
      if (tMatch[1] !== undefined) {
        // Single string Tj
        const decoded = tMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '')
          .replace(/\\t/g, ' ')
          .replace(/\\\\/g, '\\')
          .replace(/\\([0-7]{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
          .replace(/\\(.)/g, '$1');
        lines.push(decoded);
      } else if (tMatch[2]) {
        // TJ array
        const arr = tMatch[2];
        const strRegex = /\(((?:[^()\\]|\\.)*)\)/g;
        let sMatch: RegExpExecArray | null;
        const parts: string[] = [];
        while ((sMatch = strRegex.exec(arr)) !== null) {
          parts.push(sMatch[1].replace(/\\(.)/g, '$1'));
        }
        if (parts.length) lines.push(parts.join(''));
      }
    }
  }

  const text = lines.join(' ').replace(/\s+/g, ' ').trim();

  if (text.length < 100) {
    return '[PDF appears to be image-based or has no extractable text layer. Please export a text-layer PDF or use XLSX/XER format for best results.]';
  }

  return text.substring(0, 120000); // cap at ~120k chars
}

// ─── DOCX extraction ──────────────────────────────────────────────────────────
// DOCX is a ZIP (PK format) containing word/document.xml.
// We parse the ZIP central directory to find and inflate word/document.xml
// using Node's built-in zlib — no external zip library needed.

async function extractTextFromDocxBuffer(buffer: Buffer): Promise<string> {
  try {
    const { inflateRawSync } = await import('zlib');

    // Find ZIP local file headers and extract word/document.xml
    // ZIP local file header signature: PK\x03\x04
    let offset = 0;
    let documentXml = '';

    while (offset < buffer.length - 30) {
      // Check for local file header
      if (
        buffer[offset] === 0x50 &&
        buffer[offset + 1] === 0x4B &&
        buffer[offset + 2] === 0x03 &&
        buffer[offset + 3] === 0x04
      ) {
        const compressionMethod = buffer.readUInt16LE(offset + 8);
        const compressedSize    = buffer.readUInt32LE(offset + 18);
        const uncompressedSize  = buffer.readUInt32LE(offset + 22);
        const fileNameLength    = buffer.readUInt16LE(offset + 26);
        const extraFieldLength  = buffer.readUInt16LE(offset + 28);

        const fileNameStart = offset + 30;
        const fileName = buffer.slice(fileNameStart, fileNameStart + fileNameLength).toString('utf-8');
        const dataStart = fileNameStart + fileNameLength + extraFieldLength;

        if (fileName === 'word/document.xml' && compressedSize > 0) {
          const compressedData = Buffer.from(buffer.slice(dataStart, dataStart + compressedSize));
          try {
            let xmlBytes: Buffer;
            if (compressionMethod === 0) {
              // Stored (no compression)
              xmlBytes = compressedData;
            } else {
              // Deflate (method 8)
              xmlBytes = inflateRawSync(compressedData);
            }
            documentXml = xmlBytes.toString('utf-8');
          } catch {
            return '[DOCX: Failed to decompress document content.]';
          }
          break;
        }

        offset = dataStart + compressedSize;
      } else {
        offset++;
      }
    }

    if (!documentXml) {
      return '[DOCX: Could not find document content. Please check the file is a valid .docx and is not password-protected.]';
    }

    // Extract text from XML
    const paragraphs: string[] = [];
    const paraRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
    let pMatch: RegExpExecArray | null;

    while ((pMatch = paraRegex.exec(documentXml)) !== null) {
      const para = pMatch[0];
      const textRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
      const parts: string[] = [];
      let tMatch: RegExpExecArray | null;
      while ((tMatch = textRegex.exec(para)) !== null) {
        parts.push(tMatch[1]);
      }
      if (parts.length) paragraphs.push(parts.join(''));
    }

    const text = paragraphs.filter(Boolean).join('\n').replace(/\n{3,}/g, '\n\n').trim();
    if (text.length < 50) {
      return '[DOCX: Document appears to be empty or content could not be extracted.]';
    }
    return text.substring(0, 120000);
  } catch (err) {
    return '[DOCX: Error reading file. Please ensure the file is a valid .docx document.]';
  }
}

// ─── XLSX extraction ──────────────────────────────────────────────────────────

async function extractTextFromXlsxBuffer(buffer: Buffer): Promise<string> {
  try {
    const workbook = new ExcelJS.Workbook();
    // Convert to ArrayBuffer to avoid Buffer<ArrayBufferLike> generic mismatch
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(buffer as any);

    const sections: string[] = [];

    workbook.eachSheet((sheet, sheetId) => {
      sections.push(`\n=== Sheet: ${sheet.name} ===`);
      const rows: string[] = [];
      sheet.eachRow({ includeEmpty: false }, (row) => {
        const cells = row.values as any[];
        // cells is 1-indexed, skip index 0
        const rowText = cells.slice(1)
          .map((c: any) => {
            if (c === null || c === undefined) return '';
            if (typeof c === 'object' && c.result !== undefined) return String(c.result);
            if (typeof c === 'object' && c.text !== undefined) return String(c.text);
            if (c instanceof Date) return c.toISOString().split('T')[0];
            return String(c);
          })
          .filter(Boolean)
          .join('\t');
        if (rowText.trim()) rows.push(rowText);
      });
      sections.push(rows.slice(0, 2000).join('\n')); // cap per sheet
    });

    return sections.join('\n').substring(0, 120000);
  } catch (err) {
    return '[XLSX: Error reading file. Please ensure the file is a valid Excel workbook.]';
  }
}

// ─── XER extraction (Primavera P6) ───────────────────────────────────────────
// XER is a tab-delimited text format. We parse the main tables.

function extractTextFromXerBuffer(buffer: Buffer): string {
  try {
    const text = buffer.toString('utf-8');
    const lines = text.split('\n');

    const sections: Record<string, string[][]> = {};
    let currentTable = '';
    let headers: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('%T\t')) {
        currentTable = trimmed.slice(3).trim();
        sections[currentTable] = [];
        headers = [];
      } else if (trimmed.startsWith('%F\t')) {
        headers = trimmed.slice(3).split('\t');
      } else if (trimmed.startsWith('%R\t')) {
        const values = trimmed.slice(3).split('\t');
        if (headers.length > 0) {
          const row: Record<string, string> = {};
          headers.forEach((h, i) => { row[h] = values[i] || ''; });
          sections[currentTable]?.push(Object.values(row));
        }
      }
    }

    const output: string[] = ['=== Primavera P6 XER Programme Export ===\n'];

    // Key tables to extract for programme review
    const keyTables = ['PROJECT', 'TASK', 'TASKPRED', 'RSRC', 'TASKRSRC', 'PROJWBS', 'CALENDAR'];

    for (const tableName of keyTables) {
      if (!sections[tableName]?.length) continue;
      output.push(`\n=== ${tableName} (${sections[tableName].length} records) ===`);
      // For TASK table, include first 500 rows; others first 200
      const maxRows = tableName === 'TASK' ? 500 : 200;
      sections[tableName].slice(0, maxRows).forEach(row => {
        output.push(row.join('\t'));
      });
    }

    const result = output.join('\n');
    return result.length > 10 ? result.substring(0, 120000) : '[XER: No programme data found in file.]';
  } catch (err) {
    return '[XER: Error parsing Primavera P6 export file.]';
  }
}

// ─── XML extraction (MS Project / Asta Powerproject) ─────────────────────────

function extractTextFromXmlBuffer(buffer: Buffer): string {
  try {
    const xml = buffer.toString('utf-8');

    // Check if it's an MSP XML
    const isMsp = xml.includes('<Project xmlns') || xml.includes('<Task>') || xml.includes('<Tasks>');
    const isAsta = xml.includes('AstaPowerproject') || xml.includes('<STRAT_') || xml.includes('<BAR ');

    const output: string[] = [];

    if (isMsp) {
      output.push('=== Microsoft Project XML Export ===\n');
      // Extract project metadata
      const projectName = xml.match(/<Name>(.*?)<\/Name>/)?.[1] || '';
      const startDate = xml.match(/<StartDate>(.*?)<\/StartDate>/)?.[1] || '';
      const finishDate = xml.match(/<FinishDate>(.*?)<\/FinishDate>/)?.[1] || '';
      if (projectName) output.push(`Project Name: ${projectName}`);
      if (startDate)   output.push(`Start Date: ${startDate}`);
      if (finishDate)  output.push(`Finish Date: ${finishDate}`);

      // Extract tasks
      const taskRegex = /<Task>([\s\S]*?)<\/Task>/g;
      let taskMatch: RegExpExecArray | null;
      let taskCount = 0;
      output.push('\n=== TASKS ===');

      while ((taskMatch = taskRegex.exec(xml)) !== null && taskCount < 1000) {
        const task = taskMatch[1];
        const get = (tag: string) => task.match(new RegExp(`<${tag}>(.*?)</${tag}>`))?.[1] || '';
        const name     = get('Name');
        const duration = get('Duration');
        const start    = get('Start');
        const finish   = get('Finish');
        const wbs      = get('WBS');
        const crit     = get('Critical');
        const free     = get('FreeSlack');
        const total    = get('TotalSlack');
        if (name) {
          output.push(`${wbs ? `[${wbs}] ` : ''}${name}\tDuration: ${duration}\tStart: ${start}\tFinish: ${finish}\tCritical: ${crit}\tFreeFloat: ${free}\tTotalFloat: ${total}`);
          taskCount++;
        }
      }

      // Extract dependencies
      const depRegex = /<Dependency>([\s\S]*?)<\/Dependency>/g;
      let depMatch: RegExpExecArray | null;
      output.push('\n=== DEPENDENCIES ===');
      let depCount = 0;
      while ((depMatch = depRegex.exec(xml)) !== null && depCount < 500) {
        const dep = depMatch[1];
        const get = (tag: string) => dep.match(new RegExp(`<${tag}>(.*?)</${tag}>`))?.[1] || '';
        output.push(`Predecessor: ${get('PredecessorUID')} → Successor: ${get('SuccessorUID')} Type: ${get('Type')} Lag: ${get('LinkLag')}`);
        depCount++;
      }
    } else if (isAsta) {
      output.push('=== Asta Powerproject XML Export ===\n');
      // Extract BAR (task) elements from Asta
      const barRegex = /<BAR\s([^/]*?)\/>/g;
      let barMatch: RegExpExecArray | null;
      let count = 0;
      output.push('=== BARS (Tasks) ===');
      while ((barMatch = barRegex.exec(xml)) !== null && count < 1000) {
        output.push(barMatch[1]);
        count++;
      }
    } else {
      // Generic XML — just extract text content
      output.push('=== XML Programme File ===\n');
      const textContent = xml
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      output.push(textContent.substring(0, 60000));
    }

    return output.join('\n').substring(0, 120000);
  } catch (err) {
    return '[XML: Error parsing programme file.]';
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export type ParsedFileResult = {
  text: string;
  fileType: 'pdf' | 'docx' | 'xlsx' | 'xer' | 'xml' | 'unknown';
  characterCount: number;
  truncated: boolean;
};

export async function parseUploadedFile(
  buffer: Buffer,
  originalFilename: string,
  mimeType: string
): Promise<ParsedFileResult> {
  const ext = originalFilename.toLowerCase().split('.').pop() || '';
  const maxChars = 100000;

  let text = '';
  let fileType: ParsedFileResult['fileType'] = 'unknown';

  if (ext === 'pdf' || mimeType === 'application/pdf') {
    text = extractTextFromPdfBuffer(buffer);
    fileType = 'pdf';
  } else if (ext === 'docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    text = await extractTextFromDocxBuffer(buffer);
    fileType = 'docx';
  } else if (ext === 'xlsx' || ext === 'xls' || mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    text = await extractTextFromXlsxBuffer(buffer);
    fileType = 'xlsx';
  } else if (ext === 'xer') {
    text = extractTextFromXerBuffer(buffer);
    fileType = 'xer';
  } else if (ext === 'xml' || mimeType === 'application/xml' || mimeType === 'text/xml') {
    text = extractTextFromXmlBuffer(buffer);
    fileType = 'xml';
  } else {
    // Try as plain text
    text = buffer.toString('utf-8').substring(0, maxChars);
    fileType = 'unknown';
  }

  const truncated = text.length > maxChars;
  if (truncated) text = text.substring(0, maxChars) + '\n[... content truncated for AI processing ...]';

  return {
    text,
    fileType,
    characterCount: text.length,
    truncated,
  };
}
