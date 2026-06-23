import { create } from 'zustand';
import type { ExamState } from '../types/exam';
import { REMINDER_CONFIG } from '../constants/fieldMappings';

export const useExamStore = create<ExamState>((set) => ({
  // 数据状态
  exams: [],
  rawExcelData: null,
  excelColumns: null,

  // UI 状态
  step: 'upload',
  columnMapping: null,
  globalReminderMinutes: REMINDER_CONFIG.default,

  // Actions
  setRawExcelData: (data, columns) =>
    set({
      rawExcelData: data,
      excelColumns: columns,
    }),

  setColumnMapping: (mapping) =>
    set({
      columnMapping: mapping,
    }),

  setExams: (exams) =>
    set({
      exams,
    }),

  updateExam: (id, updates) =>
    set((state) => ({
      exams: state.exams.map((exam) =>
        exam.id === id ? { ...exam, ...updates } : exam
      ),
    })),

  deleteExam: (id) =>
    set((state) => ({
      exams: state.exams.filter((exam) => exam.id !== id),
    })),

  setGlobalReminderMinutes: (minutes) =>
    set({
      globalReminderMinutes: minutes,
    }),

  setStep: (step) =>
    set({
      step,
    }),

  reset: () =>
    set({
      exams: [],
      rawExcelData: null,
      excelColumns: null,
      step: 'upload',
      columnMapping: null,
      globalReminderMinutes: REMINDER_CONFIG.default,
    }),
}));
