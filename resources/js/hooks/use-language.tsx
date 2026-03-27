import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect
    
} from 'react';
import type {ReactNode} from 'react';

export type Language = 'en' | 'fr';

const translations = {
    en: {
        // Navigation
        'nav.dashboard': 'Go to Dashboard',
        'nav.login': 'Log in',
        'nav.register': 'Register',
        'nav.logout': 'Log out',

        // Common
        'common.email': 'Email address',
        'common.password': 'Password',
        'common.name': 'Name',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.view': 'View',
        'common.create': 'Create',
        'common.search': 'Search',
        'common.loading': 'Loading...',
        'common.noResults': 'No results found',
        'common.dashboard': 'Dashboard',

        // Auth - Login
        'auth.login.title': 'Log in to your account',
        'auth.login.description': 'Enter your email and password below to log in',
        'auth.login.emailPlaceholder': 'email@example.com',
        'auth.login.passwordPlaceholder': 'Password',
        'auth.login.rememberMe': 'Remember me',
        'auth.login.forgotPassword': 'Forgot password?',
        'auth.login.button': 'Log in',
        'auth.login.noAccount': "Don't have an account?",
        'auth.login.signUp': 'Sign up',

        // Auth - Register
        'auth.register.title': 'Create an account',
        'auth.register.description': 'Enter your details below to create your account',
        'auth.register.iAmA': 'I am a...',
        'auth.register.student': 'Student',
        'auth.register.instructor': 'Instructor',
        'auth.register.namePlaceholder': 'Full name',
        'auth.register.confirmPassword': 'Confirm password',
        'auth.register.button': 'Create account',
        'auth.register.hasAccount': 'Already have an account?',

        // Auth - Common
        'auth.quote': 'A comprehensive examination platform with anti-cheating measures, real-time monitoring, and automatic grading.',
        'auth.trusted': 'Trusted by educational institutions worldwide',

        // Dashboard
        'dashboard.welcome': 'Welcome back',
        'dashboard.instructor.subtitle': 'Manage your exams and monitor student progress.',
        'dashboard.student.subtitle': 'View your assigned exams and track your results.',

        // Dashboard - Instructor
        'dashboard.createExam': 'Create Exam',
        'dashboard.createExam.desc': 'Design a new exam',
        'dashboard.myExams': 'My Exams',
        'dashboard.myExams.desc': 'View all exams',
        'dashboard.monitor': 'Monitor',
        'dashboard.monitor.desc': 'Live exam sessions',
        'dashboard.grading': 'Grading',
        'dashboard.grading.desc': 'Review submissions',
        'dashboard.gettingStarted': 'Getting Started',
        'dashboard.gettingStarted.desc': 'Follow these steps to create your first exam',
        'dashboard.step1.title': 'Create an Exam',
        'dashboard.step1.desc': 'Set up title, duration, and scheduling',
        'dashboard.step2.title': 'Add Questions',
        'dashboard.step2.desc': 'Multiple choice, true/false, essay, etc.',
        'dashboard.step3.title': 'Assign Students',
        'dashboard.step3.desc': 'Select who can take the exam',
        'dashboard.step4.title': 'Publish & Monitor',
        'dashboard.step4.desc': 'Track progress in real-time',
        'dashboard.createFirst': 'Create Your First Exam',
        'dashboard.quickTips': 'Quick Tips',
        'dashboard.quickTips.desc': 'Best practices for exam management',
        'dashboard.tip1': 'Shuffle questions to prevent cheating between students',
        'dashboard.tip2': 'Set time limits to prevent students from looking up answers',
        'dashboard.tip3': 'Use fullscreen mode for secure exam taking',
        'dashboard.tip4': 'Auto-grade multiple choice and true/false questions',
        'dashboard.tip5': 'Monitor violations during active exams',
        'dashboard.tip6': 'Review essays manually for thorough grading',

        // Dashboard - Student
        'dashboard.availableExams': 'Available Exams',
        'dashboard.availableExams.desc': 'View and start exams',
        'dashboard.inProgress': 'In Progress',
        'dashboard.inProgress.desc': 'Continue your exams',
        'dashboard.results': 'Results',
        'dashboard.results.desc': 'View your grades',
        'dashboard.howToTake': 'How to Take Exams',
        'dashboard.howToTake.desc': 'Follow these steps for a smooth exam experience',
        'dashboard.studentStep1.title': 'Go to Available Exams',
        'dashboard.studentStep1.desc': 'View exams assigned to you',
        'dashboard.studentStep2.title': 'Start the Exam',
        'dashboard.studentStep2.desc': 'Enter fullscreen mode to begin',
        'dashboard.studentStep3.title': 'Answer Questions',
        'dashboard.studentStep3.desc': 'Your answers save automatically',
        'dashboard.studentStep4.title': 'Submit',
        'dashboard.studentStep4.desc': 'Submit before time runs out',
        'dashboard.viewAvailable': 'View Available Exams',
        'dashboard.importantRules': 'Important Rules',
        'dashboard.importantRules.desc': 'Follow these rules to avoid violations',
        'dashboard.rule1': 'Stay in fullscreen during the entire exam',
        'dashboard.rule2': "Don't switch tabs or open other windows",
        'dashboard.rule3': 'No copy/paste is allowed during exams',
        'dashboard.rule4': 'Right-click is disabled for security',
        'dashboard.rule5': 'Violations are logged and reported to instructors',
        'dashboard.rule6': 'Auto-submit happens when time expires',
        'dashboard.violationWarning': 'Too many violations may result in automatic submission!',

        // Exams - Instructor List
        'exams.title': 'Exams',
        'exams.subtitle': 'Create and manage your exams',
        'exams.create': 'Create Exam',
        'exams.empty': 'No exams created yet',
        'exams.createFirst': 'Create Your First Exam',
        'exams.questions': 'Questions',
        'exams.students': 'Students',
        'exams.attempts': 'Attempts',
        'exams.duration': 'Duration',
        'exams.start': 'Start',
        'exams.end': 'End',
        'exams.status.published': 'Published',
        'exams.status.draft': 'Draft',
        'exams.status.live': 'Live',
        'exams.delete.confirm': 'Are you sure you want to delete this exam?',
        'exams.delete.title': 'Delete Exam',
        'exams.delete.description': 'This action cannot be undone. This will permanently delete the exam and all associated data.',
        'exams.card.view': 'View',
        'exams.card.edit': 'Edit',
        'exams.card.assign': 'Assign',
        'exams.card.monitor': 'Monitor',
        'exams.card.delete': 'Delete',
        'exams.card.publish': 'Publish',
        'exams.card.unpublish': 'Unpublish',
        'exams.search.placeholder': 'Search exams...',

        // Exams - Create/Edit Form
        'exams.create.title': 'Create New Exam',
        'exams.edit.title': 'Edit Exam',
        'exams.create.subtitle': 'Set up your exam details. You can add questions after creating the exam.',
        'exams.details': 'Exam Details',
        'exams.details.description': 'Configure the basic settings for your exam.',
        'exams.fields.title': 'Title',
        'exams.fields.title.placeholder': 'e.g., Midterm Exam',
        'exams.fields.type': 'Correction Type',
        'exams.fields.type.placeholder': 'Select type',
        'exams.fields.type.auto': 'Auto-Correction (MCQ only)',
        'exams.fields.type.hybrid': 'Hybrid (Includes Free Text)',
        'exams.fields.description': 'Description',
        'exams.fields.description.placeholder': 'Instructions or notes for students...',
        'exams.fields.duration': 'Duration (minutes)',
        'exams.fields.attempts': 'Allowed Attempts',
        'exams.fields.start_time': 'Start Time',
        'exams.fields.end_time': 'End Time',
        'exams.fields.passing_score': 'Passing Score (%)',
        'exams.fields.passing_score.optional': '(optional)',
        'exams.fields.passing_score.placeholder': 'e.g., 60',
        'exams.fields.options': 'Options',
        'exams.fields.shuffle_questions': 'Shuffle questions for each student',
        'exams.fields.shuffle_options': 'Shuffle answer options',
        'exams.fields.show_results': 'Show results to students after submission',

        // Questions
        'exams.questions.title': 'Questions',
        'exams.questions.add': 'Add Question',
        'exams.questions.edit': 'Edit Question',
        'exams.questions.new': 'New Question',
        'exams.questions.points': 'Points',
        'exams.points': 'points',
        'exams.questions.points_total': 'Total points',
        'exams.questions.type': 'Question Type',
        'exams.questions.content': 'Question Text',
        'exams.questions.content.placeholder': 'Enter your question...',
        'exams.questions.options': 'Answer Options',
        'exams.questions.options.add': 'Add Option',
        'exams.questions.options.placeholder': 'Option',
        'exams.questions.correct_answer': 'Correct Answer',
        'exams.questions.correct_answers': 'Correct Answer(s)',
        'exams.questions.correct_answer.placeholder': 'Use | to separate multiple accepted answers',
        'exams.questions.correct_answer.true': 'True',
        'exams.questions.correct_answer.false': 'False',
        'exams.questions.grading_notes': 'Grading Notes (for instructor)',
        'exams.questions.grading_notes.placeholder': 'Key points to look for when grading...',
        'exams.questions.none': 'No questions yet. Add your first question to get started.',
        'exams.questions.delete.confirm': 'Delete this question?',
        'exams.questions.import.aiken': 'Bulk Import (Aiken Format)',
        'exams.questions.import.aiken.desc': 'Quickly add multiple choice questions from a text file. Each question should have options A, B, C, D and an ANSWER line.',
        'exams.questions.import.template': 'Template',
        'exams.questions.import.select': 'Select .txt',
        'exams.questions.type.mcq_single': 'Multiple Choice (Single)',
        'exams.questions.type.mcq_multiple': 'Multiple Choice (Multiple)',
        'exams.questions.type.true_false': 'True/False',
        'exams.questions.type.short_text': 'Short Text',
        'exams.questions.type.essay': 'Essay',

        // Exam Show (Command Center)
        'exams.show.manage': 'Manage Settings',
        'exams.show.configure': 'Configure Content',
        'exams.show.configure.desc': 'Add questions and set rules',
        'exams.show.access': 'Manage Access',
        'exams.show.access.desc': 'Invite students or groups',
        'exams.show.proctor': 'Live Proctoring',
        'exams.show.proctor.desc': 'Monitor active students',
        'exams.show.grading': 'Grading & Results',
        'exams.show.grading.desc': 'Review and export scores',
        'exams.show.recent': 'Recent Submissions',
        'exams.show.recent.desc': 'Overview of student activity',
        'exams.show.export': 'Export CSV',
        'exams.show.stats': 'Quick Stats',
        'exams.show.availability': 'Availability',
        'exams.show.starts': 'Starts',
        'exams.show.ends': 'Ends',
        'exams.show.points_total': 'Points Total',
        'exams.show.assigned': 'Assigned Students',
        'exams.show.success_score': 'Success Score',
        'exams.show.duration': 'Duration',
        'exams.show.review': 'Review',
        'exams.show.none': 'No attempts recorded yet',
        'exams.show.none.desc': 'Students will appear here once they start the exam',
        'exams.show.needs_review': 'Needs Review',
        'exams.show.all_graded': 'All Graded',
        'exams.show.live_now': 'LIVE NOW',

        // Attempt Statuses
        'status.in_progress': 'In Progress',
        'status.submitted': 'Submitted',
        'status.graded': 'Graded',
        'status.auto_submitted': 'Auto-Submitted',

        // Grading Dashboard
        'grading.title': 'Grading Dashboard',
        'grading.subtitle': 'Review and finalize student submissions',
        'grading.stats.total': 'Total Submissions',
        'grading.stats.pending': 'Pending Review',
        'grading.stats.graded': 'Graded',
        'grading.stats.published': 'Published',
        'grading.stats.average': 'Average Score',
        'grading.bulk.auto_grade': 'Auto-Grade All',
        'grading.bulk.publish': 'Publish All Graded',
        'grading.table.student': 'Student',
        'grading.table.status': 'Status',
        'grading.table.score': 'Score',
        'grading.table.violations': 'Violations',
        'grading.table.submitted': 'Submitted At',
        'grading.table.actions': 'Actions',
        'grading.action.review': 'Review & Grade',
        'grading.action.publish': 'Publish Grade',
        'grading.action.unpublish': 'Unpublish',
        'grading.empty': 'No submissions found for this exam.',
        'grading.show.export': 'Export Analysis',
        'grading.filter.all': 'All Students',
        'grading.filter.passed': 'Passed',
        'grading.filter.failed': 'Failed',
        'grading.filter.has_violations': 'Has Violations',
        'grading.filter.no_violations': 'No Violations',
        'grading.filter.pending': 'Pending Review',
        'grading.filter.graded': 'Graded only',
        'grading.filter.published': 'Published only',
        'grading.bulk.selected': '{0} students selected',
        'grading.bulk.grade_selected': 'Grade Selected',
        'grading.bulk.publish_selected': 'Publish Selected',

        'common.all': 'All',
        'common.filters': 'Filters',
        'common.on': 'ON',
        'common.off': 'OFF',
        'common.optional': 'Optional',
        'common.more': 'More',
        'common.update': 'Update',
        'common.none': 'None',
        'common.back': 'Back',
        'common.status.correct': 'Correct',
        'common.status.incorrect': 'Incorrect',
        'common.status.partial': 'Partial',

        // Attempt Review
        'grading.review.title': 'Attempt Review',
        'grading.review.details': 'Attempt Details',
        'grading.review.sidebar.score': 'Final Score',
        'grading.review.sidebar.penalty': 'Penalty',
        'grading.review.sidebar.finalize': 'Finalize Grading',
        'grading.review.sidebar.publish': 'Publish Result',
        'grading.review.sidebar.violations': 'Security Violations',
        'grading.review.question.points': 'Points Earned',
        'grading.review.question.feedback': 'Instructor Feedback',
        'grading.review.question.feedback.placeholder': 'Add feedback for the student...',
        'grading.review.penalty.apply': 'Apply Penalty',
        'grading.review.penalty.none': 'No Penalty',
        'grading.review.penalty.manual': 'Manual Deduction',
        'grading.review.penalty.zero': 'Zero Score (Fail)',
        'grading.review.penalty.points': 'Points to deduct',
        'grading.review.penalty.reason': 'Reason for penalty',
        'grading.review.penalty.placeholder': 'e.g., Multiple security violations found',
        'grading.review.navigate.prev': 'Previous Attempt',
        'grading.review.navigate.next': 'Next Attempt',
        'grading.review.save_feedback': 'Save Feedback',
        'grading.review.auto_graded': 'Auto-Graded',
        'grading.review.manual_needed': 'Manual Review Needed',

        // Hero
        'hero.title': 'Secure Online Exams',
        'hero.subtitle': 'Made Simple',
        'hero.description':
            'A comprehensive examination platform with anti-cheating measures, real-time monitoring, and automatic grading. Perfect for educational institutions.',
        'hero.enterDashboard': 'Enter Dashboard',
        'hero.getStarted': 'Get Started',
        'hero.signIn': 'Sign In',

        // Features
        'features.title': 'Platform Features',
        'features.antiCheating.title': 'Anti-Cheating Protection',
        'features.antiCheating.description':
            'Fullscreen mode, tab switch detection, copy/paste prevention, and automatic violation logging',
        'features.timedExams.title': 'Timed Exams',
        'features.timedExams.description':
            'Set duration limits, schedule start/end times, and auto-submit when time runs out',
        'features.autoGrading.title': 'Auto-Grading',
        'features.autoGrading.description':
            'Automatic grading for multiple choice, true/false, and short answer questions',
        'features.monitoring.title': 'Real-Time Monitoring',
        'features.monitoring.description':
            'Track student progress, view active sessions, and monitor violations in real-time',
        'features.questionTypes.title': 'Multiple Question Types',
        'features.questionTypes.description':
            'Support for single/multiple choice, true/false, short text, and essay questions',
        'features.studentFriendly.title': 'Student-Friendly',
        'features.studentFriendly.description':
            'Easy exam navigation, answer auto-save, and clear time remaining display',

        // Roles
        'roles.title': 'For Everyone',
        'roles.instructors.title': 'For Instructors',
        'roles.instructors.item1': 'Create and manage exams with flexible settings',
        'roles.instructors.item2': 'Add various question types with points and images',
        'roles.instructors.item3': 'Assign exams to specific students',
        'roles.instructors.item4': 'Monitor students in real-time during exams',
        'roles.instructors.item5': 'Review and grade submissions',
        'roles.instructors.item6': 'View detailed violation reports',
        'roles.students.title': 'For Students',
        'roles.students.item1': 'Access assigned exams from your dashboard',
        'roles.students.item2': 'Take exams in a secure fullscreen environment',
        'roles.students.item3': 'Navigate questions easily with progress tracking',
        'roles.students.item4': 'Auto-save answers as you work',
        'roles.students.item5': 'View results and feedback after grading',
        'roles.students.item6': 'Track your exam history and scores',

        // CTA
        'cta.title': 'Ready to Get Started?',
        'cta.description':
            'Join our secure examination platform today and experience a better way to conduct online assessments.',
        'cta.button': 'Create Your Account',

        // Footer
        'footer.copyright': 'Secure Exam System. All rights reserved.',

        // Exams - Common
        'exam.duration': 'Duration',
        'exam.minutes': 'minutes',
        'exam.questions': 'Questions',
        'exam.points': 'points',
        'exam.attempts': 'Attempts',
        'exam.used': 'used',
        'exam.of': 'of',
        'exam.availableUntil': 'Available Until',
        'exam.status.inProgress': 'In Progress',
        'exam.status.submitted': 'Submitted',
        'exam.status.autoSubmitted': 'Auto-Submitted',
        'exam.status.graded': 'Graded',
        'exam.status.upcoming': 'Upcoming',
        'exam.status.ended': 'Ended',
        'exam.status.available': 'Available',
        'exam.violations': 'violations',
        'exam.securityViolation': 'Security violation detected!',

        // Exams - Student List
        'student.exams.title': 'My Exams',
        'student.exams.subtitle': 'View and take your assigned exams',
        'student.exams.available': 'Available Exams',
        'student.exams.completed': 'Completed Exams',
        'student.exams.none': "You don't have any assigned exams yet.",
        'student.exams.noAvailable': 'No exams available at this time.',
        'student.exams.continue': 'Continue',
        'student.exams.start': 'Start',
        'student.exams.viewResults': 'View Results',
        'student.exams.awaitingGrade': 'Awaiting grade',
        'student.exams.pendingRelease': 'Grade Pending Release',
        'student.exams.noAttempts': 'No attempts left',

        // Student - Results List
        'student.results.title': 'My Results',
        'student.results.subtitle': 'Track your performance across all exams',
        'student.results.none': 'No graded results have been published yet.',
        'student.results.exam': 'Exam',
        'student.results.score': 'Final Score',
        'student.results.published': 'Published on',
        'student.results.viewDetail': 'View Grade Details',

        // Student - Grade Detail
        'student.grade.title': 'Grade Details',
        'student.grade.summary': 'Performance Summary',
        'student.grade.penaltyApplied': 'Disciplinary Penalty Applied',
        'student.grade.penaltyReason': 'Reason',
        'student.grade.violations': 'Security Violations',
        'student.grade.breakdown': 'Question Breakdown',
        'student.grade.solutionsPrivate': 'Detailed solutions are currently private.',
        'student.grade.solutionsPrivateDesc': 'Your instructor has not yet enabled the option to view correct answers and feedback for this exam.',
        'student.grade.earned': 'Earned',
        'student.grade.feedback': 'Instructor Feedback',
        'student.grade.correct': 'Correct',
        'student.grade.incorrect': 'Incorrect',
        'student.grade.partial': 'Partial Credit',
        'student.grade.yourAnswer': 'Your Answer',
        'student.grade.correctAnswer': 'Correct Answer',

        // Exams - Student Show
        'student.exam.info': 'Exam Information',
        'student.exam.rules': 'Important Rules',
        'student.exam.rule.fullscreen': 'The exam will run in fullscreen mode. Exiting fullscreen will be logged as a violation.',
        'student.exam.rule.tabs': 'Tab switching and window focus loss will be detected and logged.',
        'student.exam.rule.copyPaste': 'Copy, paste, and right-click are disabled during the exam.',
        'student.exam.rule.autoSubmit': 'Multiple violations may result in automatic submission of your exam.',
        'student.exam.rule.autoSave': 'Your answers are auto-saved, but make sure to submit before time runs out.',
        'student.exam.attempts': 'Your Attempts',
        'student.exam.attemptNumber': 'Attempt',
        'student.exam.inProgressDesc': 'You have an exam in progress.',
        'student.exam.acknowledge': 'I understand the exam rules and that my activity will be monitored. I am ready to start the exam.',
        'student.exam.starting': 'Starting...',
        'student.exam.notAvailable': 'This exam is not currently available.',
        'student.exam.allAttemptsUsed': 'You have used all your attempts for this exam.',

        // Exams - Taking
        'exam.take.beforeYouBegin': 'Before you begin:',
        'exam.take.rule1': 'This exam will open in fullscreen mode',
        'exam.take.rule2': 'Do not switch tabs, windows, or exit fullscreen',
        'exam.take.rule3': 'Copy, paste, and right-click are disabled',
        'exam.take.rule4': 'Violations will be recorded and may result in automatic submission',
        'exam.take.rule5': 'Time limit:',
        'exam.take.start': 'Start Exam',
        'exam.take.fullscreenRequired': 'Fullscreen Required',
        'exam.take.fullscreenDesc': 'This exam must be taken in fullscreen mode to ensure a secure environment.',
        'exam.take.enterFullscreen': 'Enter Fullscreen',
        'exam.take.locked': 'Exam Locked',
        'exam.take.lockedReason': 'Your exam timer is still running. Click below to return to fullscreen and continue your exam.',
        'exam.take.returnWithin': 'Please return to fullscreen within {0} seconds to avoid automatic submission.',
        'exam.take.return': 'Return to Exam',
        'exam.take.saving': 'Saving...',
        'exam.take.submitting': 'Submitting Exam',
        'exam.take.fullscreen': 'Fullscreen',
        'exam.take.submit': 'Submit Exam',
        'exam.take.answered': 'Answered',
        'exam.take.notAnswered': 'Not answered',
        'exam.take.flaggedDesc': 'Flagged for review',
        'exam.take.question': 'Question',
        'exam.take.flag': 'Flag',
        'exam.take.unflag': 'Unflag',
        'exam.take.selectMultiple': 'Select all that apply',
        'exam.take.shortTextPlaceholder': 'Type your answer here...',
        'exam.take.essayPlaceholder': 'Write your answer here...',
        'exam.take.previous': 'Previous',
        'exam.take.next': 'Next',
        'exam.take.confirmTitle': 'Submit Exam?',
        'exam.take.confirmDesc': 'Are you sure you want to submit your exam? You cannot change your answers after submission.',
        'exam.take.confirmStats': 'You have answered {0} of {1} questions.',

        // Monitoring Dashboard
        'monitor.title': 'Live Control Room',
        'monitor.subtitle': 'Real-time proctoring and student session management.',
        'monitor.live': 'Live',
        'monitor.autoRefresh': 'Auto-Sync',
        'monitor.refresh': 'Sync Data',
        'monitor.totalAssigned': 'Total Students',
        'monitor.inProgress': 'Active Now',
        'monitor.completed': 'Finished',
        'monitor.notStarted': 'Not Started',
        'monitor.activeStudents': 'Live Sessions',
        'monitor.noActive': 'No Active Sessions',
        'monitor.recentViolations': 'Security Alerts',
        'monitor.recentViolationsDesc': 'Real-time security breach detection feed.',
        'monitor.noViolations': 'No Alerts Detected',
        'monitor.studentAttempts': 'Session History',
        'monitor.noAttempts': 'No attempts recorded yet.',
        'monitor.answered': 'Progress',
        'monitor.ago': 'ago',
        'monitor.secShort': 's',
        'monitor.minShort': 'm',
        'monitor.hourShort': 'h',

        'monitor.broadcast.title': 'Global Broadcast',
        'monitor.broadcast.subtitle': 'Communicate with all students instantly.',
        'monitor.broadcast.placeholder': 'Type a message to the entire class...',
        'monitor.broadcast.button': 'Send Broadcast',
        'monitor.broadcast.success': 'Message broadcasted successfully',

        'monitor.action.reset': 'Reset Attempt',
        'monitor.action.resetDesc': 'This will delete all answers and let the student restart. Continue?',
        'monitor.action.delete': 'Delete Permanently',
        'monitor.action.deleteDesc': 'This will permanently remove the attempt and all logs. Continue?',
        'monitor.action.clearViolations': 'Clear Alerts',
        'monitor.action.clearViolationsDesc': 'Reset violation count for this student. Continue?',
        'monitor.action.forceSubmit': 'Force Hand-in',
        'monitor.action.forceSubmit.confirm': 'Are you sure you want to force submit this exam? The student will be locked out immediately.',
        'monitor.action.pause': 'Pause Session',
        'monitor.action.resume': 'Resume Session',
        'monitor.action.extend_time': 'Extend Duration',
        'monitor.action.extend_time.prompt': 'Enter the number of minutes to add to this session.',
        'monitor.action.extend_time.placeholder': 'Minutes (e.g., 10)',
        'monitor.action.more': 'System Logs',

        // Violations
        'violation.tab_switch': 'Tab Switching Detected',
        'violation.tab_switch.desc': 'Student switched to another browser tab.',
        'violation.window_blur': 'Window Focus Lost',
        'violation.window_blur.desc': 'Student clicked outside the exam window.',
        'violation.fullscreen_exit': 'Fullscreen Mode Exited',
        'violation.fullscreen_exit.desc': 'Student exited the required fullscreen mode.',
        'violation.copy': 'Copy Attempt Blocked',
        'violation.copy.desc': 'Student tried to copy exam content.',
        'violation.paste': 'Paste Attempt Blocked',
        'violation.paste.desc': 'Student tried to paste content into an answer.',
        'violation.right_click': 'Right-Click Attempt Blocked',
        'violation.right_click.desc': 'Student tried to use the context menu.',
        'violation.multiple_tabs': 'Multiple Tabs Detected',
        'violation.multiple_tabs.desc': 'Student has more than one tab open for this exam.',
        'violation.devtools': 'DevTools Access Attempt',
        'violation.devtools.desc': 'Student tried to open browser developer tools.',
        'violation.view_source': 'View Source Attempt',
        'violation.view_source.desc': 'Student tried to view the page source code.',
        'violation.reload_delay': 'Reload Delay Detected',
        'violation.reload_delay.desc': 'Student took too long to return to fullscreen after reloading.',
        'violation.away_timeout': 'Away for too long',
        'violation.away_timeout.desc': 'Student was away from the exam for more than 15 seconds.',
        'violation.device_disconnected': 'Security Device Change',
        'violation.device_disconnected.desc': 'Student disconnected or closed the browser completely.',
    },
    fr: {
        // Navigation
        'nav.dashboard': 'Tableau de bord',
        'nav.login': 'Connexion',
        'nav.register': "S'inscrire",
        'nav.logout': 'Déconnexion',

        // Common
        'common.email': 'Adresse e-mail',
        'common.password': 'Mot de passe',
        'common.name': 'Nom',
        'common.save': 'Enregistrer',
        'common.cancel': 'Annuler',
        'common.delete': 'Supprimer',
        'common.edit': 'Modifier',
        'common.view': 'Voir',
        'common.create': 'Créer',
        'common.search': 'Rechercher',
        'common.loading': 'Chargement...',
        'common.noResults': 'Aucun résultat trouvé',
        'common.dashboard': 'Tableau de bord',
        'common.all': 'Tout',
        'common.filters': 'Filtres',
        'common.on': 'OUI',
        'common.off': 'NON',
        'common.optional': 'Optionnel',
        'common.more': 'Plus',
        'common.update': 'Mettre à jour',
        'common.none': 'Aucun',
        'common.back': 'Retour',
        'common.status.correct': 'Correct',
        'common.status.incorrect': 'Incorrect',
        'common.status.partial': 'Partiel',

        // Auth - Login
        'auth.login.title': 'Connectez-vous à votre compte',
        'auth.login.description': 'Entrez votre email et mot de passe ci-dessous',
        'auth.login.emailPlaceholder': 'email@exemple.com',
        'auth.login.passwordPlaceholder': 'Mot de passe',
        'auth.login.rememberMe': 'Se souvenir de moi',
        'auth.login.forgotPassword': 'Mot de passe oublié?',
        'auth.login.button': 'Se connecter',
        'auth.login.noAccount': "Vous n'avez pas de compte?",
        'auth.login.signUp': "S'inscrire",

        // Auth - Register
        'auth.register.title': 'Créer un compte',
        'auth.register.description': 'Entrez vos informations ci-dessous pour créer votre compte',
        'auth.register.iAmA': 'Je suis...',
        'auth.register.student': 'Étudiant',
        'auth.register.instructor': 'Instructeur',
        'auth.register.namePlaceholder': 'Nom complet',
        'auth.register.confirmPassword': 'Confirmer le mot de passe',
        'auth.register.button': 'Créer un compte',
        'auth.register.hasAccount': 'Vous avez déjà un compte?',

        // Auth - Common
        'auth.quote': "Une plateforme d'examen complète avec des mesures anti-triche, une surveillance en temps réel et une correction automatique.",
        'auth.trusted': "Approuvé par les établissements d'enseignement du monde entier",

        // Dashboard
        'dashboard.welcome': 'Bienvenue',
        'dashboard.instructor.subtitle': 'Gérez vos examens et suivez les progrès des étudiants.',
        'dashboard.student.subtitle': 'Consultez vos examens assignés et suivez vos résultats.',

        // Dashboard - Instructor
        'dashboard.createExam': 'Créer un Examen',
        'dashboard.createExam.desc': 'Concevoir un nouvel examen',
        'dashboard.myExams': 'Mes Examens',
        'dashboard.myExams.desc': 'Voir tous les examens',
        'dashboard.monitor': 'Surveillance',
        'dashboard.monitor.desc': 'Sessions en direct',
        'dashboard.grading': 'Notation',
        'dashboard.grading.desc': 'Examiner les soumissions',
        'dashboard.gettingStarted': 'Commencer',
        'dashboard.gettingStarted.desc': 'Suivez ces étapes pour créer votre premier examen',
        'dashboard.step1.title': 'Créer un Examen',
        'dashboard.step1.desc': 'Définir le titre, la durée et la planification',
        'dashboard.step2.title': 'Ajouter des Questions',
        'dashboard.step2.desc': 'Choix multiples, vrai/faux, dissertation, etc.',
        'dashboard.step3.title': 'Assigner des Étudiants',
        'dashboard.step3.desc': "Sélectionner qui peut passer l'examen",
        'dashboard.step4.title': 'Publier & Surveiller',
        'dashboard.step4.desc': 'Suivre la progression en temps réel',
        'dashboard.createFirst': 'Créer Votre Premier Examen',
        'dashboard.quickTips': 'Conseils Rapides',
        'dashboard.quickTips.desc': 'Meilleures pratiques pour la gestion des examens',
        'dashboard.tip1': 'Mélanger les questions pour éviter la triche entre étudiants',
        'dashboard.tip2': 'Définir des limites de temps pour éviter la recherche de réponses',
        'dashboard.tip3': 'Utiliser le mode plein écran pour un examen sécurisé',
        'dashboard.tip4': 'Correction automatique des questions à choix multiples et vrai/faux',
        'dashboard.tip5': 'Surveiller les violations pendant les examens actifs',
        'dashboard.tip6': 'Examiner les dissertations manuellement pour une notation approfondie',

        // Dashboard - Student
        'dashboard.availableExams': 'Examens Disponibles',
        'dashboard.availableExams.desc': 'Voir et commencer les examens',
        'dashboard.inProgress': 'En Cours',
        'dashboard.inProgress.desc': 'Continuer vos examens',
        'dashboard.results': 'Résultats',
        'dashboard.results.desc': 'Voir vos notes',
        'dashboard.howToTake': 'Comment Passer un Examen',
        'dashboard.howToTake.desc': 'Suivez ces étapes pour une expérience fluide',
        'dashboard.studentStep1.title': 'Aller aux Examens Disponibles',
        'dashboard.studentStep1.desc': 'Voir les examens qui vous sont assignés',
        'dashboard.studentStep2.title': "Commencer l'Examen",
        'dashboard.studentStep2.desc': 'Entrer en mode plein écran pour commencer',
        'dashboard.studentStep3.title': 'Répondre aux Questions',
        'dashboard.studentStep3.desc': 'Vos réponses sont sauvegardées automatiquement',
        'dashboard.studentStep4.title': 'Soumettre',
        'dashboard.studentStep4.desc': "Soumettre avant l'expiration du temps",
        'dashboard.viewAvailable': 'Voir les Examens Disponibles',
        'dashboard.importantRules': 'Règles Importantes',
        'dashboard.importantRules.desc': 'Suivez ces règles pour éviter les violations',
        'dashboard.rule1': "Rester en plein écran pendant tout l'examen",
        'dashboard.rule2': "Ne pas changer d'onglet ni ouvrir d'autres fenêtres",
        'dashboard.rule3': "Le copier/coller n'est pas autorisé pendant les examens",
        'dashboard.rule4': 'Le clic droit est désactivé pour la sécurité',
        'dashboard.rule5': 'Les violations sont enregistrées et signalées aux instructeurs',
        'dashboard.rule6': "La soumission automatique se produit à l'expiration du temps",
        'dashboard.violationWarning': 'Trop de violations peuvent entraîner une soumission automatique!',

        // Exams - Instructor List
        'exams.title': 'Examens',
        'exams.subtitle': 'Créez et gérez vos examens',
        'exams.create': 'Créer un Examen',
        'exams.empty': 'Aucun examen créé pour le moment',
        'exams.createFirst': 'Créez Votre Premier Examen',
        'exams.questions': 'Questions',
        'exams.students': 'Étudiants',
        'exams.attempts': 'Tentatives',
        'exams.duration': 'Durée',
        'exams.start': 'Début',
        'exams.end': 'Fin',
        'exams.status.published': 'Publié',
        'exams.status.draft': 'Brouillon',
        'exams.status.live': 'En direct',
        'exams.delete.confirm': 'Êtes-vous sûr de vouloir supprimer cet examen ?',
        'exams.delete.title': 'Supprimer l\'Examen',
        'exams.delete.description': 'Cette action est irréversible. Cela supprimera définitivement l\'examen et toutes les données associées.',
        'exams.card.view': 'Voir',
        'exams.card.edit': 'Modifier',
        'exams.card.assign': 'Assigner',
        'exams.card.monitor': 'Surveiller',
        'exams.card.delete': 'Supprimer',
        'exams.card.publish': 'Publier',
        'exams.card.unpublish': 'Dépublier',
        'exams.search.placeholder': 'Rechercher des examens...',

        // Exams - Create/Edit Form
        'exams.create.title': 'Créer un Nouvel Examen',
        'exams.edit.title': 'Modifier l\'Examen',
        'exams.create.subtitle': 'Configurez les détails de votre examen. Vous pourrez ajouter des questions après la création.',
        'exams.details': 'Détails de l\'Examen',
        'exams.details.description': 'Configurez les paramètres de base de votre examen.',
        'exams.fields.title': 'Titre',
        'exams.fields.title.placeholder': 'ex: Examen de mi-session',
        'exams.fields.type': 'Type de Correction',
        'exams.fields.type.placeholder': 'Sélectionner le type',
        'exams.fields.type.auto': 'Auto-Correction (QCM uniquement)',
        'exams.fields.type.hybrid': 'Hybride (Inclut du texte libre)',
        'exams.fields.description': 'Description',
        'exams.fields.description.placeholder': 'Instructions ou notes pour les étudiants...',
        'exams.fields.duration': 'Durée (minutes)',
        'exams.fields.attempts': 'Tentatives Autorisées',
        'exams.fields.start_time': 'Heure de Début',
        'exams.fields.end_time': 'Heure de Fin',
        'exams.fields.passing_score': 'Score de Passage (%)',
        'exams.fields.passing_score.optional': '(optionnel)',
        'exams.fields.passing_score.placeholder': 'ex: 60',
        'exams.fields.options': 'Options',
        'exams.fields.shuffle_questions': 'Mélanger les questions pour chaque étudiant',
        'exams.fields.shuffle_options': 'Mélanger les options de réponse',
        'exams.fields.show_results': 'Afficher les résultats aux étudiants après la soumission',

        // Questions
        'exams.questions.title': 'Questions',
        'exams.questions.add': 'Ajouter une Question',
        'exams.questions.edit': 'Modifier la Question',
        'exams.questions.new': 'Nouvelle Question',
        'exams.questions.points': 'Points',
        'exams.points': 'points',
        'exams.questions.points_total': 'Total des points',
        'exams.questions.type': 'Type de Question',
        'exams.questions.content': 'Texte de la Question',
        'exams.questions.content.placeholder': 'Entrez votre question...',
        'exams.questions.options': 'Options de Réponse',
        'exams.questions.options.add': 'Ajouter une Option',
        'exams.questions.options.placeholder': 'Option',
        'exams.questions.correct_answer': 'Réponse Correcte',
        'exams.questions.correct_answers': 'Réponse(s) Correcte(s)',
        'exams.questions.correct_answer.placeholder': 'Utilisez | pour séparer plusieurs réponses acceptées',
        'exams.questions.correct_answer.true': 'Vrai',
        'exams.questions.correct_answer.false': 'Faux',
        'exams.questions.grading_notes': 'Notes de Correction (pour l\'instructeur)',
        'exams.questions.grading_notes.placeholder': 'Points clés à rechercher lors de la correction...',
        'exams.questions.none': 'Aucune question pour le moment. Ajoutez votre première question pour commencer.',
        'exams.questions.delete.confirm': 'Supprimer cette question ?',
        'exams.questions.import.aiken': 'Importation en Masse (Format Aiken)',
        'exams.questions.import.aiken.desc': 'Ajoutez rapidement des questions à choix multiples à partir d\'un fichier texte. Chaque question doit avoir les options A, B, C, D et une ligne ANSWER.',
        'exams.questions.import.template': 'Modèle',
        'exams.questions.import.select': 'Sélectionner .txt',
        'exams.questions.type.mcq_single': 'Choix Multiple (Unique)',
        'exams.questions.type.mcq_multiple': 'Choix Multiple (Multiple)',
        'exams.questions.type.true_false': 'Vrai/Faux',
        'exams.questions.type.short_text': 'Texte Court',
        'exams.questions.type.essay': 'Dissertation',

        // Exam Show (Command Center)
        'exams.show.manage': 'Gérer les Paramètres',
        'exams.show.configure': 'Configurer le Contenu',
        'exams.show.configure.desc': 'Ajouter des questions et définir les règles',
        'exams.show.access': 'Gérer l\'Accès',
        'exams.show.access.desc': 'Inviter des étudiants ou des groupes',
        'exams.show.proctor': 'Surveillance en Direct',
        'exams.show.proctor.desc': 'Surveiller les étudiants actifs',
        'exams.show.grading': 'Correction & Résultats',
        'exams.show.grading.desc': 'Réviser et exporter les scores',
        'exams.show.recent': 'Soumissions Récentes',
        'exams.show.recent.desc': 'Aperçu de l\'activité des étudiants',
        'exams.show.export': 'Exporter CSV',
        'exams.show.stats': 'Stats Rapides',
        'exams.show.availability': 'Disponibilité',
        'exams.show.starts': 'Commence',
        'exams.show.ends': 'Se termine',
        'exams.show.points_total': 'Total des Points',
        'exams.show.assigned': 'Étudiants Assignés',
        'exams.show.success_score': 'Score de Réussite',
        'exams.show.duration': 'Durée',
        'exams.show.review': 'Réviser',
        'exams.show.none': 'Aucune tentative enregistrée',
        'exams.show.none.desc': 'Les étudiants apparaîtront ici une fois qu\'ils auront commencé l\'examen',
        'exams.show.needs_review': 'Nécessite une Révision',
        'exams.show.all_graded': 'Tout est Noté',
        'exams.show.live_now': 'EN DIRECT',

        // Attempt Statuses
        'status.in_progress': 'En Cours',
        'status.submitted': 'Soumis',
        'status.graded': 'Noté',
        'status.auto_submitted': 'Auto-Soumis',

        // Grading Dashboard
        'grading.title': 'Tableau de Bord de Correction',
        'grading.subtitle': 'Réviser et finaliser les soumissions des étudiants',
        'grading.stats.total': 'Total des Soumissions',
        'grading.stats.pending': 'En attente de Révision',
        'grading.stats.graded': 'Noté',
        'grading.stats.published': 'Publié',
        'grading.stats.average': 'Score Moyen',
        'grading.bulk.auto_grade': 'Auto-Corriger Tout',
        'grading.bulk.publish': 'Publier Tous les Notés',
        'grading.table.student': 'Étudiant',
        'grading.table.status': 'Statut',
        'grading.table.score': 'Score',
        'grading.table.violations': 'Violations',
        'grading.table.submitted': 'Soumis à',
        'grading.table.actions': 'Actions',
        'grading.action.review': 'Réviser & Noter',
        'grading.action.publish': 'Publier la Note',
        'grading.action.unpublish': 'Dépublier',
        'grading.empty': 'Aucune soumission trouvée pour cet examen.',
        'grading.show.export': 'Exporter l\'Analyse',
        'grading.filter.all': 'Tous les Étudiants',
        'grading.filter.passed': 'Réussi',
        'grading.filter.failed': 'Échoué',
        'grading.filter.has_violations': 'Avec Violations',
        'grading.filter.no_violations': 'Sans Violation',
        'grading.filter.pending': 'En attente',
        'grading.filter.graded': 'Notés uniquement',
        'grading.filter.published': 'Publiés uniquement',
        'grading.bulk.selected': '{0} étudiants sélectionnés',
        'grading.bulk.grade_selected': 'Noter la Sélection',
        'grading.bulk.publish_selected': 'Publier la Sélection',

        // Attempt Review
        'grading.review.title': 'Révision de la Tentative',
        'grading.review.details': 'Détails de la Tentative',
        'grading.review.sidebar.score': 'Score Final',
        'grading.review.sidebar.penalty': 'Pénalité',
        'grading.review.sidebar.finalize': 'Finaliser la Correction',
        'grading.review.sidebar.publish': 'Publier le Résultat',
        'grading.review.sidebar.violations': 'Violations de Sécurité',
        'grading.review.question.points': 'Points Obtenus',
        'grading.review.question.feedback': 'Commentaire de l\'Instructeur',
        'grading.review.question.feedback.placeholder': 'Ajouter un commentaire pour l\'étudiant...',
        'grading.review.penalty.apply': 'Appliquer une Pénalité',
        'grading.review.penalty.none': 'Aucune Pénalité',
        'grading.review.penalty.manual': 'Déduction Manuelle',
        'grading.review.penalty.zero': 'Score Zéro (Échec)',
        'grading.review.penalty.points': 'Points à déduire',
        'grading.review.penalty.reason': 'Raison de la pénalité',
        'grading.review.penalty.placeholder': 'ex: Plusieurs violations de sécurité détectées',
        'grading.review.navigate.prev': 'Tentative Précédente',
        'grading.review.navigate.next': 'Tentative Suivante',
        'grading.review.save_feedback': 'Enregistrer le Commentaire',
        'grading.review.auto_graded': 'Auto-Corrigé',
        'grading.review.manual_needed': 'Révision Manuelle Requise',

        // Hero
        'hero.title': 'Examens en Ligne Sécurisés',
        'hero.subtitle': 'Simplifiés',
        'hero.description':
            "Une plateforme d'examen complète avec des mesures anti-triche, une surveillance en temps réel et une correction automatique. Parfait pour les établissements d'enseignement.",
        'hero.enterDashboard': 'Accéder au Tableau de Bord',
        'hero.getStarted': 'Commencer',
        'hero.signIn': 'Se Connecter',

        // Features
        'features.title': 'Fonctionnalités de la Plateforme',
        'features.antiCheating.title': 'Protection Anti-Triche',
        'features.antiCheating.description':
            "Mode plein écran, détection de changement d'onglet, prévention du copier/coller et journalisation automatique des violations",
        'features.timedExams.title': 'Examens Chronométrés',
        'features.timedExams.description':
            'Définissez des limites de durée, planifiez les heures de début/fin et soumettez automatiquement à expiration du temps',
        'features.autoGrading.title': 'Correction Automatique',
        'features.autoGrading.description':
            'Correction automatique pour les questions à choix multiples, vrai/faux et réponses courtes',
        'features.monitoring.title': 'Surveillance en Temps Réel',
        'features.monitoring.description':
            'Suivez la progression des étudiants, visualisez les sessions actives et surveillez les violations en temps réel',
        'features.questionTypes.title': 'Types de Questions Multiples',
        'features.questionTypes.description':
            'Prise en charge des choix simple/multiple, vrai/faux, texte court et questions de dissertation',
        'features.studentFriendly.title': 'Convivial pour les Étudiants',
        'features.studentFriendly.description':
            'Navigation facile, sauvegarde automatique des réponses et affichage clair du temps restant',

        // Roles
        'roles.title': 'Pour Tout le Monde',
        'roles.instructors.title': 'Pour les Instructeurs',
        'roles.instructors.item1':
            'Créez et gérez des examens avec des paramètres flexibles',
        'roles.instructors.item2':
            'Ajoutez différents types de questions avec des points et des images',
        'roles.instructors.item3':
            'Attribuez des examens à des étudiants spécifiques',
        'roles.instructors.item4':
            'Surveillez les étudiants en temps réel pendant les examens',
        'roles.instructors.item5': 'Examinez et notez les soumissions',
        'roles.instructors.item6':
            'Consultez les rapports détaillés des violations',
        'roles.students.title': 'Pour les Étudiants',
        'roles.students.item1':
            'Accédez aux examens assignés depuis votre tableau de bord',
        'roles.students.item2':
            'Passez les examens dans un environnement plein écran sécurisé',
        'roles.students.item3':
            'Naviguez facilement entre les questions avec suivi de progression',
        'roles.students.item4':
            'Sauvegarde automatique des réponses pendant que vous travaillez',
        'roles.students.item5':
            'Consultez les résultats et commentaires après la correction',
        'roles.students.item6':
            "Suivez l'historique de vos examens et vos scores",

        // CTA
        'cta.title': 'Prêt à Commencer?',
        'cta.description':
            "Rejoignez notre plateforme d'examen sécurisée dès aujourd'hui et découvrez une meilleure façon de mener des évaluations en ligne.",
        'cta.button': 'Créer Votre Compte',

        // Footer
        'footer.copyright': "Système d'Examen Sécurisé. Tous droits réservés.",

        // Exams - Common
        'exam.duration': 'Durée',
        'exam.minutes': 'minutes',
        'exam.questions': 'Questions',
        'exam.points': 'points',
        'exam.attempts': 'Tentatives',
        'exam.used': 'utilisées',
        'exam.of': 'sur',
        'exam.availableUntil': 'Disponible jusqu’au',
        'exam.status.inProgress': 'En cours',
        'exam.status.submitted': 'Soumis',
        'exam.status.autoSubmitted': 'Soumission auto',
        'exam.status.graded': 'Noté',
        'exam.status.upcoming': 'À venir',
        'exam.status.ended': 'Terminé',
        'exam.status.available': 'Disponible',
        'exam.violations': 'violations',
        'exam.securityViolation': 'Violation de sécurité détectée !',

        // Exams - Student List
        'student.exams.title': 'Mes Examens',
        'student.exams.subtitle': 'Consultez et passez vos examens assignés',
        'student.exams.available': 'Examens Disponibles',
        'student.exams.completed': 'Examens Terminés',
        'student.exams.none': 'Vous n’avez pas encore d’examens assignés.',
        'student.exams.noAvailable': 'Aucun examen disponible pour le moment.',
        'student.exams.continue': 'Continuer',
        'student.exams.start': 'Commencer',
        'student.exams.viewResults': 'Voir les Résultats',
        'student.exams.awaitingGrade': 'En attente de notation',
        'student.exams.pendingRelease': 'Note en Attente de Publication',
        'student.exams.noAttempts': 'Plus de tentatives restantes',

        // Student - Results List
        'student.results.title': 'Mes Résultats',
        'student.results.subtitle': 'Suivez vos performances sur tous les examens',
        'student.results.none': 'Aucun résultat noté n’a encore été publié.',
        'student.results.exam': 'Examen',
        'student.results.score': 'Note Finale',
        'student.results.published': 'Publié le',
        'student.results.viewDetail': 'Voir les Détails de la Note',

        // Student - Grade Detail
        'student.grade.title': 'Détails de la Note',
        'student.grade.summary': 'Résumé de la Performance',
        'student.grade.penaltyApplied': 'Pénalité Disciplinaire Appliquée',
        'student.grade.penaltyReason': 'Raison',
        'student.grade.violations': 'Violations de Sécurité',
        'student.grade.breakdown': 'Détail par Question',
        'student.grade.solutionsPrivate': 'Les solutions détaillées sont actuellement privées.',
        'student.grade.solutionsPrivateDesc': 'Votre instructeur n’a pas encore activé l’option pour voir les bonnes réponses et les commentaires pour cet examen.',
        'student.grade.earned': 'Obtenu',
        'student.grade.feedback': 'Commentaire de l’Instructeur',
        'student.grade.correct': 'Correct',
        'student.grade.incorrect': 'Incorrect',
        'student.grade.partial': 'Crédit Partiel',
        'student.grade.yourAnswer': 'Votre Réponse',
        'student.grade.correctAnswer': 'Bonne Réponse',

        // Exams - Student Show
        'student.exam.info': 'Informations sur l’Examen',
        'student.exam.rules': 'Règles Importantes',
        'student.exam.rule.fullscreen': 'L’examen se déroulera en mode plein écran. Sortir du mode plein écran sera enregistré comme une violation.',
        'student.exam.rule.tabs': 'Le changement d’onglet et la perte de focus de la fenêtre seront détectés et enregistrés.',
        'student.exam.rule.copyPaste': 'Le copier-coller et le clic droit sont désactivés pendant l’examen.',
        'student.exam.rule.autoSubmit': 'Plusieurs violations peuvent entraîner la soumission automatique de votre examen.',
        'student.exam.rule.autoSave': 'Vos réponses sont sauvegardées automatiquement, mais assurez-vous de soumettre avant la fin du temps.',
        'student.exam.attempts': 'Vos Tentatives',
        'student.exam.attemptNumber': 'Tentative',
        'student.exam.inProgressDesc': 'Vous avez un examen en cours.',
        'student.exam.acknowledge': 'Je comprends les règles de l’examen et que mon activité sera surveillée. Je suis prêt à commencer.',
        'student.exam.starting': 'Démarrage...',
        'student.exam.notAvailable': 'Cet examen n’est pas disponible actuellement.',
        'student.exam.allAttemptsUsed': 'Vous avez utilisé toutes vos tentatives pour cet examen.',

        // Exams - Taking
        'exam.take.beforeYouBegin': 'Avant de commencer :',
        'exam.take.rule1': 'Cet examen s’ouvrira en mode plein écran',
        'exam.take.rule2': 'Ne changez pas d’onglet, de fenêtre et ne quittez pas le plein écran',
        'exam.take.rule3': 'Le copier-coller et le clic droit sont désactivés',
        'exam.take.rule4': 'Les violations seront enregistrées et peuvent entraîner une soumission automatique',
        'exam.take.rule5': 'Limite de temps :',
        'exam.take.start': 'Commencer l’Examen',
        'exam.take.fullscreenRequired': 'Plein Écran Requis',
        'exam.take.fullscreenDesc': 'Cet examen doit être passé en mode plein écran pour garantir un environnement sécurisé.',
        'exam.take.enterFullscreen': 'Passer en Plein Écran',
        'exam.take.locked': 'Examen Verrouillé',
        'exam.take.lockedReason': 'Le minuteur de votre examen tourne toujours. Cliquez ci-dessous pour revenir en plein écran et continuer votre examen.',
        'exam.take.returnWithin': 'Veuillez revenir en plein écran dans {0} secondes pour éviter la soumission automatique.',
        'exam.take.return': 'Retourner à l’Examen',
        'exam.take.saving': 'Enregistrement...',
        'exam.take.submitting': 'Soumission de l\'examen',
        'exam.take.fullscreen': 'Plein écran',
        'exam.take.submit': 'Soumettre l’Examen',
        'exam.take.answered': 'Répondu',
        'exam.take.notAnswered': 'Pas répondu',
        'exam.take.flaggedDesc': 'Marqué pour révision',
        'exam.take.question': 'Question',
        'exam.take.flag': 'Marquer',
        'exam.take.unflag': 'Démarquer',
        'exam.take.selectMultiple': 'Sélectionnez tout ce qui s’applique',
        'exam.take.shortTextPlaceholder': 'Tapez votre réponse ici...',
        'exam.take.essayPlaceholder': 'Écrivez votre réponse ici...',
        'exam.take.previous': 'Précédent',
        'exam.take.next': 'Suivant',
        'exam.take.confirmTitle': 'Soumettre l’Examen ?',
        'exam.take.confirmDesc': 'Êtes-vous sûr de vouloir soumettre votre examen ? Vous ne pourrez plus modifier vos réponses après la soumission.',
        'exam.take.confirmStats': 'Vous avez répondu à {0} questions sur {1}.',

        // Monitor - General
        'monitor.title': 'Surveillance en Direct',
        'monitor.subtitle': 'Tableau de bord de suivi et sécurité en temps réel',
        'monitor.live': 'LIVE',
        'monitor.autoRefresh': 'Synchronisation Auto',
        'monitor.refresh': 'Actualiser',
        'monitor.totalAssigned': 'Total Inscrits',
        'monitor.inProgress': 'En Cours',
        'monitor.completed': 'Terminés',
        'monitor.notStarted': 'Non Démarrés',
        'monitor.activeStudents': 'Flux Étudiants',
        'monitor.activeStudentsDesc': 'Surveillance des sessions actives',
        'monitor.recentViolations': 'Alertes Sécurité',
        'monitor.recentViolationsDesc': 'Derniers incidents détectés sur le périmètre',
        'monitor.studentAttempts': 'Historique des Tentatives',
        'monitor.studentAttemptsDesc': 'Gestion globale des sessions d\'examen',
        'monitor.noActive': 'AUCUN ÉTUDIANT ACTIF',
        'monitor.noViolations': 'PÉRIMÈTRE SÉCURISÉ',
        'monitor.noAttempts': 'AUCUNE TENTATIVE',
        'monitor.lastActivity': 'Dernière activité',
        'monitor.answered': 'RÉPONDU',
        'monitor.ago': 'il y a',
        'monitor.secShort': 's',
        'monitor.minShort': 'm',
        'monitor.hourShort': 'h',

        // Monitor - Actions
        'monitor.action.reset': 'Réinitialiser Progressions',
        'monitor.action.resetDesc': 'L\'étudiant pourra recommencer l\'examen. Toutes les réponses seront archivées.',
        'monitor.action.delete': 'Supprimer Tentative',
        'monitor.action.deleteDesc': 'Suppression définitive de la tentative et des journaux. Continuer ?',
        'monitor.action.clearViolations': 'Effacer Alertes',
        'monitor.action.clearViolationsDesc': 'Réinitialiser le compteur de violations. Continuer ?',
        'monitor.action.forceSubmit': 'Forcer le Rendu',
        'monitor.action.forceSubmit.confirm': 'Forcer la soumission ? L\'étudiant sera immédiatement verrouillé.',
        'monitor.action.pause': 'Suspendre Session',
        'monitor.action.resume': 'Reprendre Session',
        'monitor.action.extend_time': 'Prolonger Durée',
        'monitor.action.extend_time.prompt': 'Minutes à ajouter à cette session :',
        'monitor.action.extend_time.placeholder': 'Minutes (ex: 10)',
        'monitor.action.more': 'Journaux Système',

        // Monitor - Student Controls
        'monitor.studentControls': 'Contrôle Sessions',
        'monitor.broadcast.title': 'DIFFUSION GLOBALE',
        'monitor.broadcast.subtitle': 'Communiquer avec les Étudiants',
        'monitor.broadcast.description': 'Les messages apparaissent instantanément sur tous les écrans actifs.',
        'monitor.broadcast.placeholder': 'Message à diffuser à toute la classe...',
        'monitor.broadcast.button': 'Diffuser',
        'monitor.broadcast.sending': 'Envoi en cours...',
        'monitor.broadcast.success': 'Message diffusé avec succès',

        // Exams - Taking - Pause
        'exam.take.pausedTitle': 'Examen en Pause',
        'exam.take.pausedDesc': 'L\'instructeur a temporairement mis votre session d\'examen en pause. Veuillez attendre de nouvelles instructions.',
        'exam.take.awaitingSignal': 'En attente du signal de l\'instructeur...',
        'exam.take.resumedToast': 'Examen Repris',
        'exam.take.resumedDesc': 'L\'instructeur a repris votre session d\'examen.',

        // Violations - User Friendly Explanations
        'violation.tab_switch': 'Changement d\'onglet',
        'violation.tab_switch.desc': 'L\'étudiant est passé à un autre onglet du navigateur.',
        'violation.window_blur': 'Fenêtre quittée',
        'violation.window_blur.desc': 'L\'étudiant a cliqué en dehors de la fenêtre de l\'examen.',
        'violation.fullscreen_exit': 'Plein écran quitté',
        'violation.fullscreen_exit.desc': 'L\'étudiant a quitté le mode plein écran obligatoire.',
        'violation.copy': 'Tentative de copie',
        'violation.copy.desc': 'L\'étudiant a essayé de copier du texte de l\'examen.',
        'violation.paste': 'Tentative de collage',
        'violation.paste.desc': 'L\'étudiant a essayé de coller du texte dans une réponse.',
        'violation.right_click': 'Tentative de clic droit',
        'violation.right_click.desc': 'L\'étudiant a essayé d\'utiliser le menu contextuel.',
        'violation.multiple_tabs': 'Plusieurs onglets ouverts',
        'violation.multiple_tabs.desc': 'L\'étudiant a plus d\'un onglet ouvert pour cet examen.',
        'violation.devtools': 'Outils de développement',
        'violation.devtools.desc': 'L\'étudiant a tenté d\'ouvrir les outils de développement du navigateur.',
        'violation.view_source': 'Voir le code source',
        'violation.view_source.desc': 'L\'étudiant a tenté de voir le code source de la page.',
        'violation.reload_delay': 'Retour différé après rechargement',
        'violation.reload_delay.desc': 'L\'étudiant a mis trop de temps à revenir en plein écran après avoir rechargé la page.',
        'violation.away_timeout': 'Absence trop longue',
        'violation.away_timeout.desc': 'L\'étudiant s\'est absenté de l\'examen pendant plus de 15 secondes.',
        'violation.device_disconnected': 'Appareil Déconnecté',
        'violation.device_disconnected.desc': 'L\'étudiant s\'est déconnecté de l\'examen ou a fermé complètement le navigateur.',
    },
} as const;

type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKey, params?: any[]) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('language') as Language;
            if (saved === 'en' || saved === 'fr') return saved;
            // Check browser language
            const browserLang = navigator.language.toLowerCase();
            if (browserLang.startsWith('fr')) return 'fr';
        }
        return 'en';
    });

    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
        if (typeof window !== 'undefined') {
            localStorage.setItem('language', lang);
        }
    }, []);

    const t = useCallback(
        (key: TranslationKey, params?: any[]): string => {
            let translation: string = translations[language][key] || key;
            if (params) {
                params.forEach((param, index) => {
                    translation = translation.replace(`{${index}}`, String(param));
                });
            }
            return translation;
        },
        [language],
    );

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

// Standalone hook that works without provider (for pages without LanguageProvider)
// Uses custom events to keep all instances in sync
const LANGUAGE_CHANGE_EVENT = 'app-language-change';

export function useLanguageStandalone() {
    const [language, setLanguageState] = useState<Language>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('language') as Language;
            if (saved === 'en' || saved === 'fr') return saved;
            const browserLang = navigator.language.toLowerCase();
            if (browserLang.startsWith('fr')) return 'fr';
        }
        return 'en';
    });

    // Listen for language changes from other components
    useEffect(() => {
        const handleLanguageChange = (e: CustomEvent<Language>) => {
            setLanguageState(e.detail);
        };

        window.addEventListener(
            LANGUAGE_CHANGE_EVENT,
            handleLanguageChange as EventListener,
        );
        return () => {
            window.removeEventListener(
                LANGUAGE_CHANGE_EVENT,
                handleLanguageChange as EventListener,
            );
        };
    }, []);

    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
        if (typeof window !== 'undefined') {
            localStorage.setItem('language', lang);
            // Notify all other components about the change
            window.dispatchEvent(
                new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: lang }),
            );
        }
    }, []);

    const t = useCallback(
        (key: TranslationKey, params?: any[]): string => {
            let translation: string = translations[language][key] || key;
            if (params) {
                params.forEach((param, index) => {
                    translation = translation.replace(`{${index}}`, String(param));
                });
            }
            return translation;
        },
        [language],
    );

    return { language, setLanguage, t };
}

export { translations };
export type { TranslationKey };
