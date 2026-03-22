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
        'student.exams.noAttempts': 'No attempts left',

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

        // Monitor - General
        'monitor.title': 'Monitor Exam',
        'monitor.subtitle': 'Real-time exam tracking and security dashboard',
        'monitor.live': 'Live',
        'monitor.autoRefresh': 'Auto-refresh',
        'monitor.refresh': 'Refresh',
        'monitor.totalAssigned': 'Total Assigned',
        'monitor.inProgress': 'In Progress',
        'monitor.completed': 'Completed',
        'monitor.notStarted': 'Not Started',
        'monitor.activeStudents': 'Active Students',
        'monitor.activeStudentsDesc': 'Students currently taking the exam',
        'monitor.recentViolations': 'Recent Violations',
        'monitor.recentViolationsDesc': 'Last security events detected',
        'monitor.studentAttempts': 'Student Attempts',
        'monitor.studentAttemptsDesc': 'Manage all exam attempts',
        'monitor.noActive': 'No students currently taking the exam.',
        'monitor.noViolations': 'No violations recorded yet.',
        'monitor.noAttempts': 'No attempts yet.',
        'monitor.lastActivity': 'Last activity',
        'monitor.answered': 'answered',
        'monitor.ago': 'ago',
        'monitor.secShort': 's',
        'monitor.minShort': 'm',
        'monitor.hourShort': 'h',

        // Monitor - Actions
        'monitor.action.reset': 'Reset Attempt',
        'monitor.action.resetDesc': 'The student will be able to retake the exam.',
        'monitor.action.delete': 'Delete Attempt',
        'monitor.action.deleteDesc': 'This will permanently remove the student\'s progress.',
        'monitor.action.clearViolations': 'Clear Violations',
        'monitor.action.clearViolationsDesc': 'Remove all security alerts for this student.',
        'monitor.action.forceSubmit': 'Force Submit',
        'monitor.action.viewLog': 'View Log',

        // Violations - User Friendly Explanations
        'violation.tab_switch': 'Switched Tab',
        'violation.tab_switch.desc': 'The student switched to another browser tab.',
        'violation.window_blur': 'Left Exam Window',
        'violation.window_blur.desc': 'The student clicked outside the browser window.',
        'violation.fullscreen_exit': 'Exited Fullscreen',
        'violation.fullscreen_exit.desc': 'The student left the mandatory fullscreen mode.',
        'violation.copy': 'Attempted Copy',
        'violation.copy.desc': 'The student tried to copy text from the exam.',
        'violation.paste': 'Attempted Paste',
        'violation.paste.desc': 'The student tried to paste text into an answer.',
        'violation.right_click': 'Right-Click Attempt',
        'violation.right_click.desc': 'The student tried to use the context menu.',
        'violation.multiple_tabs': 'Multiple Tabs Open',
        'violation.multiple_tabs.desc': 'The student has more than one tab open for this exam.',
        'violation.devtools': 'Developer Tools',
        'violation.devtools.desc': 'The student tried to open browser developer tools.',
        'violation.view_source': 'View Source',
        'violation.view_source.desc': 'The student tried to view the page source code.',
        'violation.reload_delay': 'Delayed Return After Reload',
        'violation.reload_delay.desc': 'The student took too long to return to fullscreen after reloading the page.',
        'violation.away_timeout': 'Away for too long',
        'violation.away_timeout.desc': 'Student was away from the exam for more than 15 seconds.',
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
        'student.exams.noAttempts': 'Plus de tentatives restantes',

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
        'monitor.title': 'Surveiller l\'Examen',
        'monitor.subtitle': 'Suivi en temps réel et tableau de bord de sécurité',
        'monitor.live': 'En direct',
        'monitor.autoRefresh': 'Auto-actualisation',
        'monitor.refresh': 'Actualiser',
        'monitor.totalAssigned': 'Total Assignés',
        'monitor.inProgress': 'En cours',
        'monitor.completed': 'Terminés',
        'monitor.notStarted': 'Pas commencés',
        'monitor.activeStudents': 'Étudiants Actifs',
        'monitor.activeStudentsDesc': 'Étudiants passant actuellement l\'examen',
        'monitor.recentViolations': 'Violations Récentes',
        'monitor.recentViolationsDesc': 'Derniers événements de sécurité détectés',
        'monitor.studentAttempts': 'Tentatives des Étudiants',
        'monitor.studentAttemptsDesc': 'Gérer toutes les tentatives d\'examen',
        'monitor.noActive': 'Aucun étudiant ne passe l\'examen actuellement.',
        'monitor.noViolations': 'Aucune violation enregistrée pour le moment.',
        'monitor.noAttempts': 'Aucune tentative pour le moment.',
        'monitor.lastActivity': 'Dernière activité',
        'monitor.answered': 'répondu',
        'monitor.ago': 'il y a',
        'monitor.secShort': 's',
        'monitor.minShort': 'm',
        'monitor.hourShort': 'h',

        // Monitor - Actions
        'monitor.action.reset': 'Réinitialiser la tentative',
        'monitor.action.resetDesc': 'L\'étudiant pourra repasser l\'examen.',
        'monitor.action.delete': 'Supprimer la tentative',
        'monitor.action.deleteDesc': 'Cela supprimera définitivement la progression de l\'étudiant.',
        'monitor.action.clearViolations': 'Effacer les violations',
        'monitor.action.clearViolationsDesc': 'Supprimer toutes les alertes de sécurité pour cet étudiant.',
        'monitor.action.forceSubmit': 'Forcer la soumission',
        'monitor.action.viewLog': 'Voir le journal',

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
