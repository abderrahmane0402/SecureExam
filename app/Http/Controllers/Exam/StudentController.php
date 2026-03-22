<?php

namespace App\Http\Controllers\Exam;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    /**
     * Display a listing of students for the instructor.
     */
    public function index(): Response
    {
        Gate::authorize('viewAny', User::class);

        $students = User::query()
            ->where('role', 'student')
            ->orderBy('group')
            ->orderBy('name')
            ->get();

        $groups = $students->pluck('group')->unique()->filter()->values();

        return Inertia::render('exams/instructor/students/index', [
            'students' => $students,
            'groups' => $groups,
        ]);
    }

    /**
     * Import students from a CSV file.
     */
    public function importCsv(Request $request): RedirectResponse
    {
        Gate::authorize('create', User::class);

        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt'],
        ]);

        $path = $request->file('file')->getRealPath();
        $file = fopen($path, 'r');

        $header = fgetcsv($file); // Skip header

        // Expected columns: name, email, group (optional)
        $count = 0;
        while (($row = fgetcsv($file)) !== false) {
            if (count($row) < 2) {
                continue;
            }

            $name = $row[0];
            $email = $row[1];
            $group = $row[2] ?? null;

            User::query()->updateOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'group' => $group,
                    'role' => User::ROLE_STUDENT,
                    'password' => Hash::make(Str::random(12)), // Random password for new students
                ]
            );
            $count++;
        }

        fclose($file);

        return back()->with('success', "$count students imported successfully.");
    }

    /**
     * Delete a student.
     */
    public function destroy(User $student): RedirectResponse
    {
        Gate::authorize('delete', $student);

        if ($student->role !== User::ROLE_STUDENT) {
            abort(403);
        }

        $student->delete();

        return back()->with('success', 'Student deleted successfully.');
    }
}
