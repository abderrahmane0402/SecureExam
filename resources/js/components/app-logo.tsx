import { BookOpen } from 'lucide-react';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-gradient-to-br from-blue-700 to-blue-500 shadow-md">
                <BookOpen className="size-5 text-white" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    ExamSecure
                </span>
            </div>
        </>
    );
}
