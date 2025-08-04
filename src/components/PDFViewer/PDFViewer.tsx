import { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import './PDFViewer.css';

// Set the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  url: string;
}

export function PDFViewer({ url }: PDFViewerProps) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPDF = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(url);
        const pdfDoc = await loadingTask.promise;
        setPdf(pdfDoc);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load PDF');
        console.error('Error loading PDF:', err);
      }
    };

    loadPDF();
  }, [url]);

  if (error) {
    return <div className="pdf-error">Error: {error}</div>;
  }

  if (!pdf) {
    return <div className="pdf-loading">Loading PDF...</div>;
  }

  return (
    <div className="pdf-viewer">
      <h2>PDF Loaded Successfully!</h2>
      <p>Number of pages: {pdf.numPages}</p>
    </div>
  );
} 