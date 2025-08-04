declare module '../../../pdf.js/build/generic/build/pdf.mjs' {
  export interface PDFDocumentProxy {
    numPages: number
    getPage(pageNumber: number): Promise<PDFPageProxy>
  }

  export interface PDFPageProxy {
    getTextContent(): Promise<TextContent>
  }

  export interface TextContent {
    items: TextItem[]
  }

  export interface TextItem {
    str: string
  }

  export interface PDFDocumentLoadingTask {
    promise: Promise<PDFDocumentProxy>
  }

  export interface GetDocumentParams {
    data: ArrayBuffer
    cMapUrl?: string
    cMapPacked?: boolean
    verbosity?: number
  }

  export interface GlobalWorkerOptions {
    workerSrc: string
  }

  export function getDocument(params: GetDocumentParams): PDFDocumentLoadingTask

  export const GlobalWorkerOptions: GlobalWorkerOptions
} 