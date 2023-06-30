interface TestcaseDetails {
  type: TestcaseResultType;
  time: number;
  memory: number;
  input?: FileContent;
  output?: FileContent; // Output in test data
  scoringRate: number; // e.g. 0.5
  userOutput?: string;
  userError?: string;
  spjMessage?: string;
  systemMessage?: string;
}

interface TestcaseResult {
  status: TaskStatus;
  result?: TestcaseDetails;
  errorMessage?: string;
}

interface SubtaskResult {
  score?: number;
  cases: TestcaseResult[];
}

declare enum ErrorType {
  SystemError,
  TestDataError
}

interface CompilationResult {
  status: TaskStatus;
  message?: string;
}

interface JudgeResult {
  subtasks?: SubtaskResult[];
}

interface OverallResult {
  error?: ErrorType;
  systemMessage?: string;
  compile?: CompilationResult;
  judge?: JudgeResult;
}

declare enum TaskStatus {
  Waiting = 0,
  Running = 1,
  Done = 2,
  Failed = 3,
  Skipped = 4
}

declare enum TestcaseResultType {
  Accepted = 1,
  WrongAnswer = 2,
  PartiallyCorrect = 3,
  MemoryLimitExceeded = 4,
  TimeLimitExceeded = 5,
  OutputLimitExceeded = 6,
  FileError = 7, // The output file does not exist
  RuntimeError = 8,
  JudgementFailed = 9, // Special Judge or Interactor fails
  InvalidInteraction = 10
}

interface FileContent {
  content: string,
  name: string
}

declare enum ProgressReportType {
  Started = 1,
  Compiled = 2,
  Progress = 3,
  Finished = 4,
  Reported = 5,
}

interface ProgressReportData {
  taskId: string;
  type: ProgressReportType;
  progress: OverallResult | CompilationResult;
}
