import { useCallback, useEffect, useRef, useState } from 'react';

// STRICT thresholds (in seconds) - matched with backend
const THRESHOLDS = {
    LOW: 3, // <3 seconds: low severity (no count)
    MEDIUM: 15, // 3-15 seconds: medium severity
    HIGH: 60, // 15-60 seconds: high severity
    CRITICAL: 60, // >60 seconds: critical
};

// Auto-submit if cumulative away time exceeds this (seconds)
const MAX_CUMULATIVE_AWAY_TIME = 15;

type Severity = 'low' | 'medium' | 'high' | 'critical';

interface UseExamSecurityOptions {
    attemptId: number;
    examId: number;
    maxViolations: number;
    initialViolationCount?: number;
    onViolation?: (type: string, count: number, severity: Severity) => void;
    onAutoSubmit?: () => void;
    onLockChange?: (locked: boolean, reason: string) => void;
    enabled?: boolean;
    initialSessionToken?: string;
}

interface ViolationPayload {
    violation_type: string;
    details: string;
    occurred_at: string;
    returned_at?: string;
    duration_seconds?: number;
    severity?: Severity;
}

interface FocusLossEvent {
    lostAt: number;
    type: string;
    details: string;
}

export function useExamSecurity({
    attemptId,
    examId,
    maxViolations = 5,
    initialViolationCount = 0,
    onViolation,
    onAutoSubmit,
    onLockChange,
    enabled = true,
    initialSessionToken,
}: UseExamSecurityOptions) {
    const [isLocked, setIsLocked] = useState(false);
    const [lockReason, setLockReason] = useState('');
    const [lastAbsenceDuration, setLastAbsenceDuration] = useState<
        number | null
    >(null);
    const [warningMessage, setWarningMessage] = useState<string | null>(null);
    const [reloadCountdown, setReloadCountdown] = useState<number | null>(null);

    const violationCountRef = useRef(initialViolationCount);
    const isSubmittingRef = useRef(false);
    const sessionTokenRef = useRef<string | null>(initialSessionToken || null);
    const hasEnteredFullscreenRef = useRef(false);
    const isInitializedRef = useRef(false);
    const lastViolationTimeRef = useRef<Record<string, number>>({});
    const focusLossEventRef = useRef<FocusLossEvent | null>(null);
    const cumulativeAwayTimeRef = useRef(0); // Track total time away
    const focusLossCountRef = useRef(0); // Track number of focus losses
    const kickTimerRef = useRef<NodeJS.Timeout | null>(null); // Timer for auto-kick while away
    const reloadTimerRef = useRef<NodeJS.Timeout | null>(null); // Timer for reload tiered penalty
    const reloadViolationLoggedRef = useRef(false);

    // Store callbacks in refs to avoid effect re-runs
    const onViolationRef = useRef(onViolation);
    const onAutoSubmitRef = useRef(onAutoSubmit);
    const onLockChangeRef = useRef(onLockChange);

    // Update refs when callbacks change
    useEffect(() => {
        onViolationRef.current = onViolation;
        onAutoSubmitRef.current = onAutoSubmit;
        onLockChangeRef.current = onLockChange;
    }, [onViolation, onAutoSubmit, onLockChange]);

    const getSeverityFromDuration = useCallback(
        (durationSeconds: number): Severity => {
            if (durationSeconds < THRESHOLDS.LOW) {
                return 'low';
            }
            if (durationSeconds <= THRESHOLDS.MEDIUM) {
                return 'medium';
            }
            if (durationSeconds <= THRESHOLDS.HIGH) {
                return 'high';
            }
            return 'critical';
        },
        [],
    );

    const lockExam = useCallback((reason: string) => {
        setIsLocked(true);
        setLockReason(reason);
        onLockChangeRef.current?.(true, reason);
    }, []);

    const unlockExam = useCallback(() => {
        setIsLocked(false);
        setLockReason('');
        onLockChangeRef.current?.(false, '');

        // Clear reload penalty if it was running
        if (reloadTimerRef.current) {
            clearInterval(reloadTimerRef.current);
            reloadTimerRef.current = null;
        }
        setReloadCountdown(null);
        reloadViolationLoggedRef.current = false;
    }, []);

    const logViolation = useCallback(
        async (
            type: string,
            details: string = '',
            durationSeconds?: number,
            returnedAt?: string,
        ) => {
            if (!enabled || isSubmittingRef.current) return;

            const severity =
                durationSeconds !== undefined
                    ? getSeverityFromDuration(durationSeconds)
                    : 'medium';

            // Focus-related violations ONLY count if severity is not low
            const isFocusViolation = [
                'tab_switch',
                'window_blur',
                'fullscreen_exit',
                'reload_delay',
            ].includes(type);
            const shouldCount = ! (isFocusViolation && severity === 'low');

            // Debounce: don't log same violation type within 2 seconds (reduced from 3)
            const now = Date.now();
            const lastTime = lastViolationTimeRef.current[type] || 0;
            if (now - lastTime < 3000 && durationSeconds === undefined) {
                return;
            }
            lastViolationTimeRef.current[type] = now;

            if (shouldCount) {
                violationCountRef.current += 1;
            }
            const count = violationCountRef.current;

            // Log to server
            try {
                const payload: ViolationPayload = {
                    violation_type: type,
                    details: details || `Violation detected: ${type}`,
                    occurred_at: new Date().toISOString(),
                    severity,
                };

                if (durationSeconds !== undefined) {
                    payload.duration_seconds = durationSeconds;
                }
                if (returnedAt) {
                    payload.returned_at = returnedAt;
                }

                const response = await fetch(
                    `/exam/attempt/${attemptId}/violation`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            'X-XSRF-TOKEN': decodeURIComponent(document.cookie.match(new RegExp('(^|;\\s*)XSRF-TOKEN=([^;]*)'))?.[2] || ''),
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        body: JSON.stringify(payload),
                    },
                );

                if (!response.ok) {
                    const errorData = await response.text();
                    console.error(
                        'Violation log failed:',
                        response.status,
                        errorData,
                    );
                } else {
                    const data = await response.json();
                    if (data.auto_submitted) {
                        isSubmittingRef.current = true;
                        // Redirect directly - exam already submitted by backend
                        window.location.href = `/student/exams/${examId}`;
                        return;
                    }
                }
            } catch (e) {
                console.error('Failed to log violation:', e);
            }

            if (shouldCount) {
                onViolationRef.current?.(type, count, severity);
            }

            // Auto-submit after max violations
            if (count >= maxViolations && !isSubmittingRef.current) {
                isSubmittingRef.current = true;
                onAutoSubmitRef.current?.();
            }
        },
        [attemptId, examId, enabled, maxViolations, getSeverityFromDuration],
    );

    const startReloadSecuritySequence = useCallback(() => {
        if (reloadTimerRef.current) return;

        // 0s: Immediately lock
        lockExam('Exam resumed: Please return to fullscreen to continue.');

        // 1s: Stabilized buffer - start countdown
        setTimeout(() => {
            if (document.fullscreenElement || isSubmittingRef.current) return;

            setReloadCountdown(10);

            reloadTimerRef.current = setInterval(() => {
                setReloadCountdown((prev) => {
                    if (prev === null || prev <= 0) {
                        if (reloadTimerRef.current) clearInterval(reloadTimerRef.current);
                        
                        // 10s: The Kick
                        if (!isSubmittingRef.current) {
                            isSubmittingRef.current = true;
                            onAutoSubmitRef.current?.();
                        }
                        return 0;
                    }

                    const next = prev - 1;

                    // 5s: The Warning / Violation log
                    if (next === 5 && !reloadViolationLoggedRef.current) {
                        reloadViolationLoggedRef.current = true;
                        logViolation('reload_delay', 'User took more than 5 seconds to return to fullscreen after reload.');
                    }

                    return next;
                });
            }, 1000);
        }, 1000);
    }, [lockExam, logViolation]);

    const handleFocusLoss = useCallback(
        (type: string, details: string) => {
            if (!isInitializedRef.current || isSubmittingRef.current) return;

            // Record when focus was lost
            focusLossEventRef.current = {
                lostAt: Date.now(),
                type,
                details,
            };

            // Lock the exam immediately
            lockExam(details);

            // Start a timer to check if they exceed cumulative limit while away
            // This kicks them out even if they don't come back
            const checkInterval = 1000; // Check every second
            kickTimerRef.current = setInterval(() => {
                if (!focusLossEventRef.current || isSubmittingRef.current) {
                    if (kickTimerRef.current)
                        clearInterval(kickTimerRef.current);
                    return;
                }

                const nowAway = Math.round(
                    (Date.now() - focusLossEventRef.current.lostAt) / 1000,
                );
                const totalWouldBe = cumulativeAwayTimeRef.current + nowAway;

                if (totalWouldBe >= MAX_CUMULATIVE_AWAY_TIME) {
                    // KICK THEM OUT IMMEDIATELY
                    isSubmittingRef.current = true;
                    if (kickTimerRef.current)
                        clearInterval(kickTimerRef.current);

                    // Log violation
                    fetch(`/exam/attempt/${attemptId}/violation`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-XSRF-TOKEN': decodeURIComponent(document.cookie.match(new RegExp('(^|;\\s*)XSRF-TOKEN=([^;]*)'))?.[2] || ''),
                        },
                        body: JSON.stringify({
                            violation_type: focusLossEventRef.current.type,
                            details: `AUTO-KICKED: Exceeded cumulative away time (${MAX_CUMULATIVE_AWAY_TIME}s)`,
                            occurred_at: new Date(
                                focusLossEventRef.current.lostAt,
                            ).toISOString(),
                            severity: 'critical',
                        }),
                    })
                        .then(() => {
                            // Auto-submit the exam
                            return fetch(
                                `/exam/attempt/${attemptId}/auto-submit`,
                                {
                                    method: 'POST',
                                    headers: {
                                        'X-XSRF-TOKEN': decodeURIComponent(document.cookie.match(new RegExp('(^|;\\s*)XSRF-TOKEN=([^;]*)'))?.[2] || ''),
                                    },
                                },
                            );
                        })
                        .finally(() => {
                            // Redirect immediately - no mercy
                            window.location.href = `/student/exams/${examId}`;
                        });
                }
            }, checkInterval);
        },
        [attemptId, examId, lockExam],
    );

    const handleFocusReturn = useCallback(async () => {
        // Clear the kick timer
        if (kickTimerRef.current) {
            clearInterval(kickTimerRef.current);
            kickTimerRef.current = null;
        }

        // Clear reload timer if active
        if (reloadTimerRef.current) {
            clearInterval(reloadTimerRef.current);
            reloadTimerRef.current = null;
        }
        setReloadCountdown(null);

        if (!focusLossEventRef.current) return;

        const event = focusLossEventRef.current;
        const returnedAt = Date.now();
        const durationMs = returnedAt - event.lostAt;
        const durationSeconds = Math.round(durationMs / 1000);

        // Clear the event
        focusLossEventRef.current = null;

        // Track cumulative stats
        focusLossCountRef.current += 1;
        cumulativeAwayTimeRef.current += durationSeconds;

        const totalAwayTime = cumulativeAwayTimeRef.current;
        const timesLeft = focusLossCountRef.current;

        // Store for UI display
        setLastAbsenceDuration(durationSeconds);

        const severity = getSeverityFromDuration(durationSeconds);

        // Check if cumulative time exceeded - auto-submit
        if (
            totalAwayTime >= MAX_CUMULATIVE_AWAY_TIME &&
            !isSubmittingRef.current
        ) {
            isSubmittingRef.current = true;

            // Log final violation
            await logViolation(
                event.type,
                `KICKED: Cumulative away time exceeded`,
                durationSeconds,
                new Date(returnedAt).toISOString(),
            );

            // Auto-submit the exam then redirect
            try {
                await fetch(`/exam/attempt/${attemptId}/auto-submit`, {
                    method: 'POST',
                    headers: {
                        'X-XSRF-TOKEN': decodeURIComponent(document.cookie.match(new RegExp('(^|;\\s*)XSRF-TOKEN=([^;]*)'))?.[2] || ''),
                    },
                });
            } catch (e) {
                console.error('Auto-submit failed:', e);
            }

            window.location.href = `/student/exams/${examId}`;
            return;
        }

        // Warning message - DON'T reveal the time limit
        let message = `⚠️ Violation #${timesLeft}: You were away for ${durationSeconds}s. `;

        if (severity === 'critical') {
            message += 'SEVERE VIOLATION - Instructor notified!';
        } else if (severity === 'high') {
            message +=
                'This is a significant violation. Further absences may result in automatic submission.';
        } else if (severity === 'medium') {
            message += 'This activity has been recorded.';
        } else {
            message += 'Warning recorded.';
        }

        setWarningMessage(message);

        // Clear warning after 6 seconds
        setTimeout(() => setWarningMessage(null), 6000);

        // Log the violation with duration info
        await logViolation(
            event.type,
            `${event.details} (Duration: ${durationSeconds}s, Incident #${timesLeft})`,
            durationSeconds,
            new Date(returnedAt).toISOString(),
        );
    }, [attemptId, examId, logViolation, getSeverityFromDuration]);

    // Request fullscreen - always allowed (doesn't depend on enabled)
    const enterFullscreen = useCallback(async () => {
        try {
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                await elem.requestFullscreen();
            } else if ((elem as any).webkitRequestFullscreen) {
                await (elem as any).webkitRequestFullscreen();
            } else if ((elem as any).msRequestFullscreen) {
                await (elem as any).msRequestFullscreen();
            }
            hasEnteredFullscreenRef.current = true;
            unlockExam();
            return true;
        } catch (e) {
            console.error('Failed to enter fullscreen:', e);
            return false;
        }
    }, [unlockExam]);

    // Exit fullscreen
    const exitFullscreen = useCallback(() => {
        if (document.fullscreenElement) {
            document.exitFullscreen?.();
        }
    }, []);

    // Return to exam (restore fullscreen and unlock)
    const returnToExam = useCallback(async () => {
        await handleFocusReturn();
        const success = await enterFullscreen();
        if (success) {
            unlockExam();
        }
        return success;
    }, [enterFullscreen, unlockExam, handleFocusReturn]);

    // Clear warning message
    const clearWarning = useCallback(() => {
        setWarningMessage(null);
    }, []);

    useEffect(() => {
        if (!enabled) return;

        // If we're enabled on mount and NOT in fullscreen, this is likely a reload/resume
        // Start the security sequence immediately (0s lock)
        if (!document.fullscreenElement && !isInitializedRef.current && !isSubmittingRef.current) {
            startReloadSecuritySequence();
        }

        // Grace period before monitoring other events starts (avoid false positives on load)
        const initTimer = setTimeout(() => {
            isInitializedRef.current = true;
        }, 2000);

        // Fullscreen change detection
        const handleFullscreenChange = () => {
            if (
                !document.fullscreenElement &&
                !isSubmittingRef.current &&
                hasEnteredFullscreenRef.current
            ) {
                handleFocusLoss(
                    'fullscreen_exit',
                    'User exited fullscreen mode',
                );
            }
        };

        // Tab visibility change
        const handleVisibilityChange = () => {
            if (document.hidden && isInitializedRef.current) {
                handleFocusLoss('tab_switch', 'User switched to another tab');
            } else if (
                !document.hidden &&
                focusLossEventRef.current?.type === 'tab_switch'
            ) {
                // Tab became visible again - will need to click return button
            }
        };

        // Window blur (clicking outside browser)
        const handleWindowBlur = () => {
            if (isInitializedRef.current && !isSubmittingRef.current) {
                handleFocusLoss('window_blur', 'Browser window lost focus');
            }
        };

        // Window focus (returning to browser)
        const handleWindowFocus = () => {
            // Don't auto-unlock - require user to click button
            // This gives them time to see the warning
        };

        // Prevent copy
        const handleCopy = (e: ClipboardEvent) => {
            e.preventDefault();
            logViolation('copy', 'User attempted to copy content');
        };

        // Prevent paste
        const handlePaste = (e: ClipboardEvent) => {
            e.preventDefault();
            logViolation('paste', 'User attempted to paste content');
        };

        // Prevent cut
        const handleCut = (e: ClipboardEvent) => {
            e.preventDefault();
            logViolation('copy', 'User attempted to cut content');
        };

        // Prevent right-click context menu (blocked but not logged as violation)
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        // Detect DevTools (basic detection)
        const handleKeyDown = (e: KeyboardEvent) => {
            // F12
            if (e.key === 'F12') {
                e.preventDefault();
                logViolation('devtools', 'User pressed F12');
            }
            // Ctrl+Shift+I (DevTools)
            if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                logViolation('devtools', 'User attempted to open DevTools');
            }
            // Ctrl+Shift+C (Inspect element)
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                logViolation('devtools', 'User attempted to inspect element');
            }
            // Ctrl+U (View source)
            if (e.ctrlKey && e.key === 'u') {
                e.preventDefault();
                logViolation(
                    'view_source',
                    'User attempted to view page source',
                );
            }
        };

        // Prevent text selection (except in inputs)
        const handleSelectStart = (e: Event) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                return;
            }
            e.preventDefault();
        };

        // Add event listeners
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener(
            'webkitfullscreenchange',
            handleFullscreenChange,
        );
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleWindowBlur);
        window.addEventListener('focus', handleWindowFocus);
        document.addEventListener('copy', handleCopy);
        document.addEventListener('paste', handlePaste);
        document.addEventListener('cut', handleCut);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('selectstart', handleSelectStart);

        // Session validation (detect multiple tabs)
        const validateSession = async () => {
            try {
                const response = await fetch(
                    `/exam/attempt/${attemptId}/validate-session`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-XSRF-TOKEN': decodeURIComponent(document.cookie.match(new RegExp('(^|;\\s*)XSRF-TOKEN=([^;]*)'))?.[2] || ''),
                        },
                        body: JSON.stringify({
                            session_token: sessionTokenRef.current,
                        }),
                    },
                );

                const data = await response.json();
                if (!data.valid) {
                    logViolation(
                        'multiple_tabs',
                        'Multiple exam tabs detected',
                    );
                }
                sessionTokenRef.current = data.token;
            } catch (e) {
                console.error('Session validation failed:', e);
            }
        };

        // Heartbeat to keep session alive
        const heartbeatInterval = setInterval(async () => {
            try {
                await fetch(`/exam/attempt/${attemptId}/heartbeat`, {
                    method: 'POST',
                    headers: {
                        'X-XSRF-TOKEN': decodeURIComponent(document.cookie.match(new RegExp('(^|;\\s*)XSRF-TOKEN=([^;]*)'))?.[2] || ''),
                    },
                });
            } catch (e) {
                console.error('Heartbeat failed:', e);
            }
        }, 30000);

        // Validate session periodically
        validateSession();
        const sessionInterval = setInterval(validateSession, 60000);

        // Cleanup
        return () => {
            document.removeEventListener(
                'fullscreenchange',
                handleFullscreenChange,
            );
            document.removeEventListener(
                'webkitfullscreenchange',
                handleFullscreenChange,
            );
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange,
            );
            window.removeEventListener('blur', handleWindowBlur);
            window.removeEventListener('focus', handleWindowFocus);
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('paste', handlePaste);
            document.removeEventListener('cut', handleCut);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('selectstart', handleSelectStart);
            clearInterval(heartbeatInterval);
            clearInterval(sessionInterval);
            clearTimeout(initTimer);
        };
    }, [attemptId, enabled, logViolation, handleFocusLoss, startReloadSecuritySequence]);

    const setSubmitting = useCallback((value: boolean) => {
        isSubmittingRef.current = value;
    }, []);

    return {
        // Actions
        enterFullscreen,
        exitFullscreen,
        returnToExam,
        setSubmitting,
        clearWarning,
        // State
        isLocked,
        lockReason,
        reloadCountdown,
        lastAbsenceDuration,
        warningMessage,
        // For direct use
        logViolation,
    };
}
