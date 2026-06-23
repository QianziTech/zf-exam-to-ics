# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A browser-based Excel-to-ICS converter that transforms exam schedule spreadsheets into calendar files. Built as a client-side-only React + TypeScript SPA with PWA support. All processing happens locally—no server communication.

**Key technology stack:**
- React 19 with React Compiler (Babel plugin)
- TypeScript 6.0
- Ant Design v6 (UI components, locale: zh_CN)
- Zustand (state management)
- Vite 8 (build tool with PWA plugin)
- xlsx (Excel parsing), ics (calendar generation), file-saver (downloads)

## Development Commands

```bash
# Install dependencies (uses pnpm)
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Lint code
pnpm lint

# Preview production build
pnpm preview
```

## Architecture

### State Management (Zustand)

Single store at `src/stores/examStore.ts` manages entire application state:
- Raw Excel data + columns
- Parsed exam items (`ExamItem[]`)
- Column mappings (Excel columns → app fields)
- UI workflow step: `upload` → `mapping` → `confirm` → `download`
- Global reminder settings + per-exam overrides
- Exam name categorization (for filtering exports)

**Critical pattern:** After `setExams()`, the store automatically:
1. Extracts unique exam names → `examNameTypes[]`
2. Pre-selects all categories in `selectedCategories[]` for export

### 4-Step Workflow

1. **Upload** (`FileUploader`): Parse Excel via `parseExcelFile()`, extract data + columns
2. **Mapping** (`ColumnMapper`): Auto-match columns via `autoMatchColumns()` using `FIELD_PATTERNS`, or let user manually map. Required fields: `courseName`, `examTime`, `location`, `seatNumber`. Optional: `examName` (defaults to "期末考试")
3. **Confirm** (`ExamInfo` + `ReminderConfig`): Display parsed exams in editable table, set global reminder time, batch-rename exam categories, filter which categories to export
4. **Download** (`DownloadButton`): Generate ICS via `generateICS()` → trigger browser download

### Data Flow

```
Excel file → parseExcelFile() 
  → rawExcelData + excelColumns (store)
  → autoMatchColumns() → columnMapping (store)
  → Transform raw rows into ExamItem[] using mapping
  → setExams() (store) → auto-extract examNameTypes
  → User edits/filters in ExamInfo
  → generateICS() → downloadICS()
```

### Type System (`src/types/exam.ts`)

- **ExamItem**: Core exam record with `id`, `courseName`, `examName`, `examTime` (string format: "2026-07-06(12:00-14:00)"), `location`, `seatNumber`, optional `reminderMinutes`
- **ParsedExamTime**: Decomposed time fields with `Date` objects
- **ColumnMapping**: Maps Excel column names to app field keys
- **ValidationError**: Row-level validation results with severity

### Constants (`src/constants/fieldMappings.ts`)

- **FIELD_PATTERNS**: Chinese synonym lists for auto-matching Excel columns (e.g., `courseName: ['课程名称', '课程', '科目']`)
- **REQUIRED_FIELDS** vs **OPTIONAL_FIELDS**
- **FILE_CONSTRAINTS**: 10MB max, 5000 rows max, `.xlsx`/`.xls` only
- **REMINDER_CONFIG**: Default 60min, range 0-1440min, presets [15, 30, 60, 120]
- **TIME_FORMAT_REGEX**: Validates "YYYY-MM-DD(HH:MM-HH:MM)" format
- **EXAM_DURATION_LIMITS**: Exam length validation (15min–6hr, warnings outside 30min–4hr)

### Utilities

- **excelParser.ts**: File validation (type, size, row count) + XLSX → JSON conversion
- **columnMatcher.ts**: Auto-match logic using pattern matching against `FIELD_PATTERNS`
- **timeParser.ts**: Parse "2026-07-06(12:00-14:00)" → `ParsedExamTime` with validation
- **icsGenerator.ts**: `ExamItem[]` → ICS event format (with alarms), trigger browser download
- **validator.ts**: Row-level validation (required fields, time format, string lengths, exam duration)
- **examNameHelper.ts**: Extract/deduplicate exam names from parsed data
- **errors.ts**: Custom error classes (`ExcelParseError`, `TimeParseError`, `ICSGenerationError`, `ValidationError`)

### Component Architecture

- **App.tsx**: Layout + step router + Ant Design ConfigProvider (custom theme: academic blue #1D3E53, paper background #FAF9F6)
- **FileUploader**: File drop/select → `parseExcelFile()` → store raw data → advance to mapping step
- **ColumnMapper**: Display auto-match result or manual Select dropdowns → validate required fields → create `ExamItem[]` → advance to confirm
- **ExamInfo**: Editable Table of parsed exams (inline edit location/seat, delete rows, batch-rename exam names, filter by category)
- **ReminderConfig**: Slider for global reminder time
- **DownloadButton**: Trigger `generateAndDownloadICS()` with filtered exams
- **usePWAInstall**: Hook for install prompt via `beforeinstallprompt` event

## Design Language

The UI follows an "academic notebook" aesthetic:
- **Colors**: Academic blue (#1D3E53) for primary, ink black (#1F2421) for text, paper beige (#FAF9F6) for background
- **Typography**: Inter for body/UI, maintains clean readability
- **Layout**: Single-column centered workspace with generous whitespace, soft rounded borders (6px)
- **Components**: Ant Design v6 with custom theme tokens

**Important:** All text, UI labels, and error messages are in Chinese (zh_CN locale).

## Build Configuration

- **vite.config.ts**: React plugin + Babel compiler plugin + PWA plugin
- **PWA manifest**: Name "考试日历导入ICS生成工具", icons in `/public/pwa/`, auto-update service worker, runtime caching for Google Fonts
- **ESLint**: Flat config using `@eslint/js`, `typescript-eslint`, `react-hooks`, `react-refresh` plugins
- **TypeScript**: Project references pattern (`tsconfig.json` → `tsconfig.app.json` + `tsconfig.node.json`)

## Key Constraints

- **File limits**: 10MB max, 5000 rows max, only `.xlsx`/`.xls` accepted
- **Time format**: Must match `YYYY-MM-DD(HH:MM-HH:MM)`, dates validated via `date-fns`
- **Field lengths**: courseName/examName ≤50 chars, location ≤100 chars, seatNumber ≤20 chars
- **Exam duration**: 15min–6hr hard limits, warnings outside 30min–4hr
- **Reminder range**: 0–1440 minutes (0–24 hours)

## Testing Notes

No test suite currently exists. When adding tests:
- Focus on utilities (parsers, validators, generators) first
- Mock file uploads for component tests
- Validate time parsing edge cases (cross-midnight, invalid formats)
- Test Excel parsing error handling (malformed files, empty sheets, oversized)

## Privacy Model

The app never sends data to servers. All Excel parsing, validation, and ICS generation occur in the browser. This is a core feature—do not introduce any network calls that transmit user data.
