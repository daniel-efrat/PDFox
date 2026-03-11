import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { EditorState, EditorTool, Annotation } from '@/types/editor';

interface EditorActions {
  setDocument: (id: string, title: string, totalPages: number) => void;
  setCurrentPage: (page: number) => void;
  setZoom: (zoom: number) => void;
  setActiveTool: (tool: EditorTool) => void;
  togglePageSelection: (index: number) => void;
  clearPageSelection: () => void;
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, data: any) => void;
  removeAnnotation: (id: string) => void;
  setSaving: (isSaving: boolean) => void;
  setUnsavedChanges: (hasChanges: boolean) => void;
  reset: () => void;
}

const initialState: EditorState = {
  documentId: null,
  title: 'Untitled Document',
  totalPages: 0,
  currentPage: 1,
  zoom: 1.0,
  activeTool: 'SELECT',
  selectedPageIndices: [],
  annotations: [],
  isSaving: false,
  hasUnsavedChanges: false,
};

export const useEditorStore = create<EditorState & EditorActions>()(
  devtools(
    (set) => ({
      ...initialState,

      setDocument: (id, title, totalPages) => 
        set({ documentId: id, title, totalPages, hasUnsavedChanges: false }),
      
      setCurrentPage: (page) => 
        set((state) => ({ currentPage: Math.max(1, Math.min(page, state.totalPages)) })),
      
      setZoom: (zoom) => 
        set({ zoom: Math.max(0.1, Math.min(zoom, 5.0)) }),
      
      setActiveTool: (tool) => 
        set({ activeTool: tool }),
      
      togglePageSelection: (index) => 
        set((state) => ({
          selectedPageIndices: state.selectedPageIndices.includes(index)
            ? state.selectedPageIndices.filter((i) => i !== index)
            : [...state.selectedPageIndices, index],
        })),
      
      clearPageSelection: () => 
        set({ selectedPageIndices: [] }),
      
      addAnnotation: (annotation) => 
        set((state) => ({ 
          annotations: [...state.annotations, annotation],
          hasUnsavedChanges: true 
        })),
      
      updateAnnotation: (id, data) => 
        set((state) => ({
          annotations: state.annotations.map((a) => 
            a.id === id ? { ...a, data } : a
          ),
          hasUnsavedChanges: true
        })),
      
      removeAnnotation: (id) => 
        set((state) => ({
          annotations: state.annotations.filter((a) => a.id !== id),
          hasUnsavedChanges: true
        })),
      
      setSaving: (isSaving) => set({ isSaving }),
      
      setUnsavedChanges: (hasUnsavedChanges) => set({ hasUnsavedChanges }),
      
      reset: () => set(initialState),
    }),
    { name: 'PDFoxEditor' }
  )
);
