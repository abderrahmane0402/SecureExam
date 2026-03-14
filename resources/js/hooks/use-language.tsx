import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    type ReactNode,
} from 'react';

export type Language = 'en' | 'fr';

type TranslationKey = keyof typeof translations.en;

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
        'footer.copyright':
            "Système d'Examen Sécurisé. Tous droits réservés.",
    },
} as const;

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKey) => string;
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
        (key: TranslationKey): string => {
            return translations[language][key] || key;
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
        (key: TranslationKey): string => {
            return translations[language][key] || key;
        },
        [language],
    );

    return { language, setLanguage, t };
}

export { translations };
export type { TranslationKey };
