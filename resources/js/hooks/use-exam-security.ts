import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

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
    onPauseStatusChange?: (paused: boolean) => void;
    enabled?: boolean;
    isPaused?: boolean;
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
    onPauseStatusChange,
    enabled = true,
    isPaused = false,
    initialSessionToken,
}: UseExamSecurityOptions) {
    const [isLocked, setIsLocked] = useState(false);
    const [isKicked, setIsKicked] = useState(false);
    const [lockReason, setLockReason] = useState('');
    const [lastAbsenceDuration, setLastAbsenceDuration] = useState<
        number | null
    >(null);
    const [reloadCountdown, setReloadCountdown] = useState<number | null>(null);
    
    // UI State
    const [hasEnteredFullscreen, setHasEnteredFullscreen] = useState(false);

    const violationCountRef = useRef(initialViolationCount);
    const isSubmittingRef = useRef(false);
    const sessionTokenRef = useRef<string | null>(initialSessionToken || null);
    const isInitializedRef = useRef(false);
    const lastViolationTimeRef = useRef<Record<string, number>>({});
    const focusLossEventRef = useRef<FocusLossEvent | null>(null);
    const cumulativeAwayTimeRef = useRef(0); 
    const focusLossCountRef = useRef(0); 
    const kickTimerRef = useRef<NodeJS.Timeout | null>(null); 
    const reloadTimerRef = useRef<NodeJS.Timeout | null>(null);
    const reloadViolationLoggedRef = useRef(false);
    const isResumingRef = useRef(false);
    const hasEnteredFullscreenRef = useRef(false);
    const isPausedRef = useRef(isPaused);

    // Sync ref with state for instant access in listeners
    isPausedRef.current = isPaused;

    // Store callbacks in refs to avoid effect re-runs
    const onViolationRef = useRef(onViolation);
    const onAutoSubmitRef = useRef(onAutoSubmit);
    const onLockChangeRef = useRef(onLockChange);
    const onPauseStatusChangeRef = useRef(onPauseStatusChange);

    useEffect(() => {
        onViolationRef.current = onViolation;
        onAutoSubmitRef.current = onAutoSubmit;
        onLockChangeRef.current = onLockChange;
        onPauseStatusChangeRef.current = onPauseStatusChange;
    }, [onViolation, onAutoSubmit, onLockChange, onPauseStatusChange]);

    const getSeverityFromDuration = useCallback(
        (durationSeconds: number): Severity => {
            if (durationSeconds < THRESHOLDS.LOW) return 'low';
            if (durationSeconds <= THRESHOLDS.MEDIUM) return 'medium';
            if (durationSeconds <= THRESHOLDS.HIGH) return 'high';
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

        if (reloadTimerRef.current) {
            clearInterval(reloadTimerRef.current);
            reloadTimerRef.current = null;
        }
        setReloadCountdown(null);
        reloadViolationLoggedRef.current = false;
    }, []);

    // Initial check for resume state
    useEffect(() => {
        if (enabled && !isPaused && !document.fullscreenElement) {
            isResumingRef.current = true;
            setTimeout(() => {
                lockExam('Security session resumed. Please re-enter fullscreen to continue.');
                setHasEnteredFullscreen(true);
            }, 0);
        }
    }, [enabled, examId, isPaused, lockExam]);

    const showToast = useCallback((message: string) => {
        toast.error(message, {
            duration: 6000,
        });
    }, []);

    const logViolation = useCallback(
        async (
            type: string,
            details: string = '',
            durationSeconds?: number,
            returnedAt?: string,
        ) => {
            if (!enabled || isSubmittingRef.current || isPausedRef.current) return;

            const severity =
                durationSeconds !== undefined
                    ? getSeverityFromDuration(durationSeconds)
                    : 'medium';

            const isFocusViolation = [
                'tab_switch',
                'window_blur',
                'fullscreen_exit',
                'reload_delay',
            ].includes(type);
            const shouldCount = ! (isFocusViolation && severity === 'low');

            const now = Date.now();
            const lastTime = lastViolationTimeRef.current[type] || 0;
            if (now - lastTime < 1500 && durationSeconds === undefined) {
                return;
            }
            lastViolationTimeRef.current[type] = now;

            if (shouldCount) {
                violationCountRef.current += 1;
            }
            const count = violationCountRef.current;

            if (!isFocusViolation) {
                showToast(`⚠️ Security Violation: ${details}`);
            }

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
                    console.error('Violation log failed:', response.status);
                } else {
                    const data = await response.json();
                    if (data.auto_submitted) {
                        isSubmittingRef.current = true;
                        setIsKicked(true);
                        onAutoSubmitRef.current?.();
                        return;
                    }
                }
            } catch (e) {
                console.error('Failed to log violation:', e);
            }

            if (shouldCount) {
                onViolationRef.current?.(type, count, severity);
            }

            if (count >= maxViolations && !isSubmittingRef.current) {
                isSubmittingRef.current = true;
                setIsKicked(true);
                onAutoSubmitRef.current?.();
            }
        },
        [attemptId, enabled, isPaused, maxViolations, getSeverityFromDuration, showToast],
    );

    const startReloadSecuritySequence = useCallback(() => {
        if (!enabled || reloadTimerRef.current || isSubmittingRef.current || isPausedRef.current) return;

        lockExam('Security check: Please return to fullscreen to continue.');
        setReloadCountdown(10);
        
        let count = 10;
        reloadTimerRef.current = setInterval(() => {
            if (document.fullscreenElement) {
                if (reloadTimerRef.current) clearInterval(reloadTimerRef.current);
                reloadTimerRef.current = null;
                setReloadCountdown(null);
                unlockExam();
                return;
            }

            count -= 1;
            setReloadCountdown(count);

            if (count === 5 && !reloadViolationLoggedRef.current) {
                reloadViolationLoggedRef.current = true;
                logViolation('reload_delay', 'Student delayed returning to fullscreen.');
            }

            if (count <= 0) {
                if (reloadTimerRef.current) clearInterval(reloadTimerRef.current);
                reloadTimerRef.current = null;
                
                if (!isSubmittingRef.current) {
                    isSubmittingRef.current = true;
                    setIsKicked(true);
                    onAutoSubmitRef.current?.();
                }
            }
        }, 1000);
    }, [lockExam, unlockExam, logViolation, enabled, isPaused]);

    const handleFocusLoss = useCallback(
        (type: string, details: string) => {
            if (!enabled || !isInitializedRef.current || isSubmittingRef.current || isPausedRef.current) return;

            if (focusLossEventRef.current) {
                if (type === 'tab_switch' && focusLossEventRef.current.type === 'window_blur') {
                    focusLossEventRef.current.type = type;
                    focusLossEventRef.current.details = details;
                }
                return;
            }

            focusLossEventRef.current = {
                lostAt: Date.now(),
                type,
                details,
            };

            lockExam(details);

            const checkInterval = 1000;
            kickTimerRef.current = setInterval(() => {
                if (!enabled || !focusLossEventRef.current || isSubmittingRef.current || isPausedRef.current) {
                    if (kickTimerRef.current) clearInterval(kickTimerRef.current);
                    return;
                }

                const nowAway = Math.floor((Date.now() - focusLossEventRef.current.lostAt) / 1000);
                const totalWouldBe = cumulativeAwayTimeRef.current + nowAway;

                if (totalWouldBe >= MAX_CUMULATIVE_AWAY_TIME) {
                    isSubmittingRef.current = true;
                    setIsKicked(true);
                    if (kickTimerRef.current) clearInterval(kickTimerRef.current);

                    fetch(`/exam/attempt/${attemptId}/violation`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-XSRF-TOKEN': decodeURIComponent(document.cookie.match(new RegExp('(^|;\\s*)XSRF-TOKEN=([^;]*)'))?.[2] || ''),
                        },
                        body: JSON.stringify({
                            violation_type: focusLossEventRef.current.type,
                            details: `AUTO-KICKED: Exceeded cumulative away time (${MAX_CUMULATIVE_AWAY_TIME}s)`,
                            occurred_at: new Date(focusLossEventRef.current.lostAt).toISOString(),
                            severity: 'critical',
                        }),
                    }).then(() => {
                        return fetch(`/exam/attempt/${attemptId}/auto-submit`, {
                            method: 'POST',
                            headers: { 'X-XSRF-TOKEN': decodeURIComponent(document.cookie.match(new RegExp('(^|;\\s*)XSRF-TOKEN=([^;]*)'))?.[2] || '') },
                        });
                    }).finally(() => {
                        onAutoSubmitRef.current?.();
                    });
                }
            }, checkInterval);
        },
        [attemptId, lockExam, enabled, isPaused],
    );

    const handleFocusReturn = useCallback(async () => {
        if (kickTimerRef.current) {
            clearInterval(kickTimerRef.current);
            kickTimerRef.current = null;
        }

        if (reloadTimerRef.current) {
            clearInterval(reloadTimerRef.current);
            reloadTimerRef.current = null;
        }
        setReloadCountdown(null);

        if (!focusLossEventRef.current) return;

        const event = focusLossEventRef.current;
        const returnedAt = Date.now();
        const durationSeconds = Math.floor((returnedAt - event.lostAt) / 1000);

        focusLossEventRef.current = null;
        focusLossCountRef.current += 1;
        cumulativeAwayTimeRef.current += durationSeconds;

        const totalAwayTime = cumulativeAwayTimeRef.current;
        const timesLeft = focusLossCountRef.current;

        setLastAbsenceDuration(durationSeconds);
        const severity = getSeverityFromDuration(durationSeconds);

        if (totalAwayTime >= MAX_CUMULATIVE_AWAY_TIME && !isSubmittingRef.current) {
            isSubmittingRef.current = true;
            setIsKicked(true);
            await logViolation(event.type, `KICKED: Cumulative away time exceeded`, durationSeconds, new Date(returnedAt).toISOString());
            try {
                await fetch(`/exam/attempt/${attemptId}/auto-submit`, {
                    method: 'POST',
                    headers: { 'X-XSRF-TOKEN': decodeURIComponent(document.cookie.match(new RegExp('(^|;\\s*)XSRF-TOKEN=([^;]*)'))?.[2] || '') },
                });
            } catch (e) { console.error(e); }
            onAutoSubmitRef.current?.();
            return;
        }

        let message = `⚠️ Violation #${timesLeft}: You were away for ${durationSeconds}s. `;
        if (severity === 'critical') message += 'SEVERE VIOLATION - Instructor notified!';
        else if (severity === 'high') message += 'Further absences may result in automatic submission.';
        else if (severity === 'medium') message += 'This activity has been recorded.';
        else message += 'Warning recorded.';

        showToast(message);

        await logViolation(
            event.type,
            `${event.details} (Duration: ${durationSeconds}s, Incident #${timesLeft})`,
            durationSeconds,
            new Date(returnedAt).toISOString(),
        );
    }, [attemptId, logViolation, getSeverityFromDuration, showToast]);

    const enterFullscreen = useCallback(async () => {
        try {
            const elem = document.documentElement;
            let request;
            if (elem.requestFullscreen) request = elem.requestFullscreen();
            else if ((elem as any).webkitRequestFullscreen) request = (elem as any).webkitRequestFullscreen();
            else if ((elem as any).mozRequestFullScreen) request = (elem as any).mozRequestFullScreen();
            else if ((elem as any).msRequestFullscreen) request = (elem as any).msRequestFullscreen();

            if (request instanceof Promise) await request;

            hasEnteredFullscreenRef.current = true;
            setHasEnteredFullscreen(true);
            unlockExam();
            return true;
        } catch (e) {
            console.error('Failed to enter fullscreen:', e);
            return false;
        }
    }, [unlockExam]);

    const exitFullscreen = useCallback(() => {
        try {
            if (document.fullscreenElement && document.visibilityState !== 'hidden') {
                document.exitFullscreen?.().catch(() => {});
            }
        } catch {
            // Silence is golden
        }
    }, []);

    const returnToExam = useCallback(async () => {
        await handleFocusReturn();
        const success = await enterFullscreen();
        if (success) unlockExam();
        return success;
    }, [enterFullscreen, unlockExam, handleFocusReturn]);

    useEffect(() => {
        if (!attemptId) return;

        const validateSession = async () => {
            try {
                const response = await fetch(`/exam/attempt/${attemptId}/validate-session`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': decodeURIComponent(document.cookie.match(new RegExp('(^|;\\s*)XSRF-TOKEN=([^;]*)'))?.[2] || '') },
                    body: JSON.stringify({ session_token: sessionTokenRef.current }),
                });
                const data = await response.json();
                if (!data.valid) logViolation('multiple_tabs', 'Multiple exam tabs detected');
                sessionTokenRef.current = data.token;
            } catch (e) { console.error(e); }
        };

        const heartbeatInterval = setInterval(async () => {
            try { 
                const response = await fetch(`/exam/attempt/${attemptId}/heartbeat`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-XSRF-TOKEN': decodeURIComponent(document.cookie.match(new RegExp('(^|;\\s*)XSRF-TOKEN=([^;]*)'))?.[2] || ''),
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.status && data.status !== 'in_progress') {
                        setIsKicked(true);
                        window.location.reload();
                        return;
                    }
                    if (data.is_paused !== undefined) {
                        onPauseStatusChangeRef.current?.(!!data.is_paused);
                    }
                } else if (response.status === 403) {
                    window.location.reload();
                } else if (response.status === 400) {
                    onPauseStatusChangeRef.current?.(true);
                }
            } catch (e) { console.error(e); }
        }, 15000);

        validateSession();
        const sessionInterval = setInterval(validateSession, 60000);

        if (enabled) {
            if (!document.fullscreenElement && !isInitializedRef.current && !isSubmittingRef.current && isResumingRef.current && !isPausedRef.current) {
                setTimeout(() => {
                    startReloadSecuritySequence();
                }, 10);
            }

            const initTimer = setTimeout(() => {
                isInitializedRef.current = true;
            }, 3000);

            const handleFullscreenChange = () => {
                if (!isPausedRef.current && !document.fullscreenElement && !isSubmittingRef.current && (isResumingRef.current || hasEnteredFullscreenRef.current)) {
                    handleFocusLoss('fullscreen_exit', 'User exited fullscreen mode');
                }
            };

            const handleVisibilityChange = () => {
                if (!isPausedRef.current && document.hidden && isInitializedRef.current) {
                    handleFocusLoss('tab_switch', 'User switched to another tab');
                }
            };

            const handleWindowBlur = () => {
                if (!isPausedRef.current && isInitializedRef.current && !isSubmittingRef.current) {
                    handleFocusLoss('window_blur', 'Browser window lost focus');
                }
            };

            const handleCopy = (e: ClipboardEvent) => { e.preventDefault(); logViolation('copy', 'User attempted to copy content'); };
            const handlePaste = (e: ClipboardEvent) => { e.preventDefault(); logViolation('paste', 'User attempted to paste content'); };
            const handleCut = (e: ClipboardEvent) => { e.preventDefault(); logViolation('cut', 'User attempted to cut content'); };
            const handleContextMenu = (e: MouseEvent) => { e.preventDefault(); };

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'F12') { e.preventDefault(); logViolation('devtools', 'User pressed F12'); }
                if (e.ctrlKey && e.shiftKey && e.key === 'I') { e.preventDefault(); logViolation('devtools', 'User attempted to open DevTools'); }
                if (e.ctrlKey && e.shiftKey && e.key === 'C') { e.preventDefault(); logViolation('devtools', 'User attempted to inspect element'); }
                if (e.ctrlKey && e.key === 'u') { e.preventDefault(); logViolation('view_source', 'User attempted to view page source'); }
            };

            const handleSelectStart = (e: Event) => {
                const target = e.target as HTMLElement;
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
                e.preventDefault();
            };

            document.addEventListener('fullscreenchange', handleFullscreenChange);
            document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.addEventListener('visibilitychange', handleVisibilityChange);
            window.addEventListener('blur', handleWindowBlur);
            document.addEventListener('copy', handleCopy);
            document.addEventListener('paste', handlePaste);
            document.addEventListener('cut', handleCut);
            document.addEventListener('contextmenu', handleContextMenu);
            document.addEventListener('keydown', handleKeyDown);
            document.addEventListener('selectstart', handleSelectStart);

            return () => {
                document.removeEventListener('fullscreenchange', handleFullscreenChange);
                document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                window.removeEventListener('blur', handleWindowBlur);
                document.removeEventListener('copy', handleCopy);
                document.removeEventListener('paste', handlePaste);
                document.removeEventListener('cut', handleCut);
                document.removeEventListener('contextmenu', handleContextMenu);
                document.removeEventListener('keydown', handleKeyDown);
                document.removeEventListener('selectstart', handleSelectStart);
                clearInterval(heartbeatInterval);
                clearInterval(sessionInterval);
                if (kickTimerRef.current) clearInterval(kickTimerRef.current);
                if (reloadTimerRef.current) clearInterval(reloadTimerRef.current);
                clearTimeout(initTimer);
            };
        }

        return () => {
            clearInterval(heartbeatInterval);
            clearInterval(sessionInterval);
        };
    }, [attemptId, enabled, isPaused, logViolation, handleFocusLoss, startReloadSecuritySequence]);

    const setSubmitting = useCallback((value: boolean) => {
        isSubmittingRef.current = value;
    }, []);

    return {
        enterFullscreen,
        exitFullscreen,
        returnToExam,
        setSubmitting,
        isLocked,
        isKicked,
        lockReason,
        reloadCountdown,
        lastAbsenceDuration,
        hasEnteredFullscreen,
        logViolation,
    };
}
