// Exam system types
export type QuestionType =
    | 'multiple_choice_single'
    | 'multiple_choice_multiple'
    | 'true_false'
    | 'short_text'
    | 'essay';

export type AttemptStatus =
    | 'in_progress'
    | 'submitted'
    | 'graded'
    | 'auto_submitted';

export type ViolationType =
    | 'tab_switch'
    | 'window_blur'
    | 'fullscreen_exit'
    | 'copy'
    | 'paste'
    | 'right_click'
    | 'multiple_tabs'
    | 'devtools'
    | 'view_source';

export interface QuestionOption {
    id: number;
    content: string;
    is_correct?: boolean;
    order: number;
}

export interface Question {
    id: number;
    exam_id: number;
    type: QuestionType;
    content: string;
    image_path: string | null;
    points: number;
    order: number;
    correct_answer: string | null;
    grading_notes: string | null;
    options: QuestionOption[];
}

export interface Exam {
    id: number;
    instructor_id: number;
    title: string;
    description: string | null;
    duration_minutes: number;
    start_time: string;
    end_time: string;
    allowed_attempts: number;
    shuffle_questions: boolean;
    shuffle_options: boolean;
    show_results: boolean;
    passing_score: number | null;
    is_published: boolean;
    created_at: string;
    updated_at: string;
    questions?: Question[];
    questions_count?: number;
    assignments_count?: number;
    attempts_count?: number;
    total_points?: number;
    instructor?: {
        id: number;
        name: string;
    };
}

export interface ExamForStudent {
    id: number;
    title: string;
    description: string | null;
    duration_minutes: number;
    start_time: string;
    end_time: string;
    allowed_attempts: number;
    questions_count: number;
    instructor: {
        id: number;
        name: string;
    };
    is_available: boolean;
    completed_attempts: number;
    can_take: boolean;
    latest_attempt: {
        id: number;
        status: AttemptStatus;
        score: number | null;
        percentage: number | null;
        violation_count: number;
        auto_submitted: boolean;
    } | null;
}

export interface ExamAssignment {
    id: number;
    exam_id: number;
    student_id: number;
    assigned_at: string;
    student?: {
        id: number;
        name: string;
        email: string;
    };
}

export interface ExamAnswer {
    id: number;
    attempt_id: number;
    question_id: number;
    selected_options: number[] | null;
    text_answer: string | null;
    is_correct: boolean | null;
    points_earned: number | null;
    instructor_feedback: string | null;
    question?: Question;
}

export interface ViolationLog {
    id: number;
    attempt_id: number;
    violation_type: ViolationType;
    details: string | null;
    duration_seconds: number | null;
    severity: 'low' | 'medium' | 'high' | 'critical';
    occurred_at: string;
    returned_at: string | null;
    ip_address: string | null;
}

export interface ExamAttempt {
    id: number;
    exam_id: number;
    student_id: number;
    attempt_number: number;
    started_at: string;
    submitted_at: string | null;
    graded_at: string | null;
    status: AttemptStatus;
    score: number | null;
    points_earned: number | null;
    total_points: number | null;
    percentage: number | null;
    violation_count: number;
    auto_submitted: boolean;
    ip_address: string | null;
    user_agent: string | null;
    exam?: Exam;
    student?: {
        id: number;
        name: string;
        email: string;
    };
    answers?: ExamAnswer[];
    violations?: ViolationLog[];
}

export interface ExamTakingQuestion {
    id: number;
    type: QuestionType;
    content: string;
    image_path: string | null;
    points: number;
    options: {
        id: number;
        content: string;
    }[];
}

export interface SavedAnswer {
    selected_options: number[] | null;
    text_answer: string | null;
}

export interface ExamTakingData {
    attempt: {
        id: number;
        started_at: string;
        remaining_time: number;
        violation_count: number;
    };
    exam: {
        id: number;
        title: string;
        duration_minutes: number;
    };
    questions: ExamTakingQuestion[];
    answers: Record<number, SavedAnswer>;
    session_token: string;
}
