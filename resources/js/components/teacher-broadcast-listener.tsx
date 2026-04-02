import { usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { MailIcon } from 'lucide-react';
import { toast } from 'sonner';

export function TeacherBroadcastListener() {
    const { auth } = usePage().props as any;
    const assignedExamIds: number[] = auth?.assigned_exam_ids || [];
    
    return (
        <>
            {assignedExamIds.map((id) => (
                <ExamChannelListener key={id} examId={id} />
            ))}
        </>
    );
}

function ExamChannelListener({ examId }: { examId: number }) {
    const { auth } = usePage().props as any;
    const userId = auth?.user?.id;

    // Global listener for public teacher broadcasts
    useEcho(`exam-room.${examId}`, '.TeacherMessageBroadcast', (e: any) => {
        // Prevent duplicate toasts if we're already on the 'take' page 
        if (window.location.pathname.includes(`/exam/take/`)) {
            return;
        }

        toast.info(e.message, {
            icon: <MailIcon className="size-4 text-blue-600" />,
            description: `From Instructor: ${e.teacher_name}`,
            duration: Infinity,
        });
    });

    // Global listener for individual messages (sent while student is on dashboard/other pages)
    useEcho(`exam-room.${examId}`, '.IndividualMessageBroadcast', (e: any) => {
        if (e.student_id == userId) {
            // Prevent duplicate toasts if we're already on the 'take' page 
            if (window.location.pathname.includes(`/exam/take/`)) {
                return;
            }

            toast.info(e.message, {
                icon: <MailIcon className="size-4 text-indigo-600" />,
                description: `Private Message from Instructor: ${e.teacher_name}`,
                duration: Infinity,
            });
        }
    });

    return null;
}
