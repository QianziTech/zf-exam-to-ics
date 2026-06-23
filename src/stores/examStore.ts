import { create } from 'zustand';
import type { ExamState } from '../types/exam';
import { REMINDER_CONFIG, FIELD_DEFAULTS } from '../constants/fieldMappings';

export const useExamStore = create<ExamState>((set, get) => ({
  // 数据状态
  exams: [],
  rawExcelData: null,
  excelColumns: null,

  // 考试名称管理
  defaultExamName: FIELD_DEFAULTS.examName,
  examNameTypes: [],
  selectedCategories: [],

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

  setExams: (exams) => {
    set({ exams });
    // 自动更新考试名称列表
    get().updateExamNameTypes();
    // 默认选择所有类别进行导出
    const types = Array.from(new Set(exams.map((e) => e.examName))).sort();
    set({ selectedCategories: types });
  },

  updateExam: (id, updates) => {
    set((state) => ({
      exams: state.exams.map((exam) =>
        exam.id === id ? { ...exam, ...updates } : exam
      ),
    }));
    // 如果更新了examName，刷新列表
    if (updates.examName !== undefined) {
      get().updateExamNameTypes();
    }
  },

  deleteExam: (id) =>
    set((state) => ({
      exams: state.exams.filter((exam) => exam.id !== id),
    })),

  setGlobalReminderMinutes: (minutes) =>
    set({
      globalReminderMinutes: minutes,
    }),

  setDefaultExamName: (name) =>
    set({
      defaultExamName: name.trim() || FIELD_DEFAULTS.examName,
    }),

  updateExamNameTypes: () =>
    set((state) => {
      const types = new Set(state.exams.map((e) => e.examName));
      return { examNameTypes: Array.from(types).sort() };
    }),

  batchUpdateExamName: (oldName, newName) => {
    set((state) => ({
      exams: state.exams.map((exam) =>
        exam.examName === oldName ? { ...exam, examName: newName } : exam
      ),
    }));
    get().updateExamNameTypes();
  },

  setSelectedCategories: (categories) =>
    set({
      selectedCategories: categories,
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
      defaultExamName: FIELD_DEFAULTS.examName,
      examNameTypes: [],
      selectedCategories: [],
      step: 'upload',
      columnMapping: null,
      globalReminderMinutes: REMINDER_CONFIG.default,
    }),
}));
