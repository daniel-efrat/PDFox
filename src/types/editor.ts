export type EditorTool = 'SELECT' | 'TEXT' | 'HIGHLIGHT' | 'DRAW' | 'SIGNATURE' | 'CROP';

export interface Annotation {
  id: string;
  type: 'TEXT' | 'HIGHLIGHT' | 'DRAW' | 'SIGNATURE';
  pageIndex: number;
  data: any; // Fabric.js object data
}

export interface PDFPage {
  index: number;
  width: number;
  height: number;
  rotation: number;
}

export interface EditorState {
  documentId: string | null;
  title: string;
  totalPages: number;
  currentPage: number;
  zoom: number;
  activeTool: EditorTool;
  selectedPageIndices: number[];
  annotations: Annotation[];
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}
