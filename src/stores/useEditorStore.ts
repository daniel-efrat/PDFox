import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { EditorState as BaseEditorState, EditorTool, Annotation } from '@/types/editor';

interface EditorState extends BaseEditorState {
  selectedBrushSize: number;
  selectedColor: string;
  selectedFontFamily: string;
  selectedFontSize: number;
  history: Annotation[][];
  historyIndex: number;
}

interface EditorActions {
  setSelectedBrushSize: (size: number) => void;
  setSelectedColor: (color: string) => void;
  setSelectedFontFamily: (font: string) => void;
  setSelectedFontSize: (size: number) => void;
  undo: () => void;
  redo: () => void;
  setDocument: (id: string, title: string, totalPages: number) => void;
  setTotalPages: (totalPages: number) => void;
  setCurrentPage: (page: number) => void;
  setZoom: (zoom: number) => void;
  setActiveTool: (tool: EditorTool) => void;
  togglePageSelection: (index: number) => void;
  clearPageSelection: () => void;
  addAnnotation: (annotation: Annotation) => void;
  setAnnotations: (annotations: Annotation[]) => void;
  updateAnnotation: (id: string, data: any) => void;
  removeAnnotation: (id: string) => void;
  setSaving: (isSaving: boolean) => void;
  setUnsavedChanges: (hasChanges: boolean) => void;
  rotatePage: (index: number, angle: number) => void;
  deletePages: (indices: number[]) => void;
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
  selectedBrushSize: 2,
  selectedColor: '#000000',
  selectedFontFamily: 'sans-serif',
  selectedFontSize: 20,
  history: [[]],
  historyIndex: 0,
};

export const useEditorStore = create<EditorState & EditorActions>()(
  devtools(
    (set) => ({
      ...initialState,

      setDocument: (id, title, totalPages) => 
        set({ documentId: id, title, totalPages, hasUnsavedChanges: false }),

      setTotalPages: (totalPages) =>
        set({ totalPages: Math.max(0, totalPages) }),
      
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
      
      setSelectedBrushSize: (size) => set({ selectedBrushSize: size }),
      
      setSelectedColor: (color) => set({ selectedColor: color }),

      setSelectedFontFamily: (font) => set({ selectedFontFamily: font }),

      setSelectedFontSize: (size) => set({ selectedFontSize: size }),

      undo: () => set((state) => {
        if (state.historyIndex > 0) {
          const newIndex = state.historyIndex - 1;
          return {
            historyIndex: newIndex,
            annotations: state.history[newIndex]
          };
        }
        return state;
      }),

      redo: () => set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          const newIndex = state.historyIndex + 1;
          return {
            historyIndex: newIndex,
            annotations: state.history[newIndex]
          };
        }
        return state;
      }),

      addAnnotation: (annotation) => 
        set((state) => {
          const newAnnotations = [...state.annotations, annotation];
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(newAnnotations);
          
          return { 
            annotations: newAnnotations,
            history: newHistory,
            historyIndex: newHistory.length - 1,
            hasUnsavedChanges: true 
          };
        }),

      setAnnotations: (annotations) =>
        set((state) => ({
          annotations,
          history: [annotations],
          historyIndex: 0,
          hasUnsavedChanges: false,
        })),
      
      updateAnnotation: (id, data) => 
        set((state) => {
          const newAnnotations = state.annotations.map((a) => 
            a.id === id ? { ...a, data } : a
          );
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(newAnnotations);

          return {
            annotations: newAnnotations,
            history: newHistory,
            historyIndex: newHistory.length - 1,
            hasUnsavedChanges: true
          };
        }),
      
      removeAnnotation: (id) => 
        set((state) => {
          const newAnnotations = state.annotations.filter((a) => a.id !== id);
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(newAnnotations);

          return {
            annotations: newAnnotations,
            history: newHistory,
            historyIndex: newHistory.length - 1,
            hasUnsavedChanges: true
          };
        }),
      
      setSaving: (isSaving) => set({ isSaving }),
      
      setUnsavedChanges: (hasUnsavedChanges) => set({ hasUnsavedChanges }),
      
      rotatePage: (index, angle) =>
        set((state) => ({
          // Logic for rotation would go here
          // For now, let's just mark it as unsaved change
          hasUnsavedChanges: true
        })),

      deletePages: (indices) =>
        set((state) => ({
          totalPages: Math.max(0, state.totalPages - indices.length),
          selectedPageIndices: [],
          hasUnsavedChanges: true
        })),

      reset: () => set(initialState),
    }),
    { name: 'PDFoxEditor' }
  )
);
