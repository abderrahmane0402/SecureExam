# Master Plan: Instructor Experience, Grading & Bulk Management

## Status Tracker
- [x] **Phase 1: Navigation, Command Center & Exam Types**
    - [x] Add `type` column to `exams` table.
    - [x] Update redirections in `ExamController`.
    - [x] Overhaul `exams/instructor/show.tsx` dashboard.
- [x] **Phase 2: Professional Grading & Results Management**
    - [x] Create Grading Queue UI.
    - [x] Create Evaluation Workspace (Side-by-Side view).
    - [x] Implement Bulk CSV Results Export.
- [x] **Phase 3: Bulk Data Power Tools**
    - [x] Implement TXT Bulk Email Assignment.
    - [x] Implement CSV Student Importer.
    - [x] Add Student Grouping logic and UI.
    - [x] Implement Aiken Format Question Import.
- [x] **Phase 4: Real-time Proctoring & Classroom Control**
    - [x] Implement Teacher-to-Student Message Broadcast.
    - [x] Add Remote Pause/Lock controls.
    - [x] Add Remote Time Extension controls.

---

## Detailed Phase Breakdown

### Phase 1: Navigation, Command Center & Exam Types
- **Exam Types (Auto vs Hybrid):**
    - Auto = MCQs/Boolean only (instant correction). 
    - Hybrid = MCQs + Free Text (needs manual review).
- **Redirection Logic:** Always land on the **Exam Show (Command Center)** after major actions.
- **UI: The Command Center (`exams/instructor/show.tsx`):**
    - Overhaul the view into a dashboard with action cards: Configure, Manage Access, Live Monitor, Grading.

### Phase 2: Professional Grading & Results Management
- **Grading Queue UI:** List attempts needing review.
- **The Evaluation Workspace:** Side-by-side view of answers and grading inputs.
- **Bulk CSV Results Export:** Download grade sheet (Name, Email, Score, Status).

### Phase 3: Bulk Data Power Tools
- **Bulk Student Assignment (.txt):** Paste emails to enroll.
- **CSV Student Importer:** Bulk create/register students (`name, email, group`).
- **Student Grouping:** Assign exams to "Class 10A" instead of individuals.
- **Aiken Format Question Import:** Rapid exam creation from text files.

### Phase 4: Real-time Proctoring & Classroom Control
- **Teacher Broadcast:** Instant toast messages to students via Reverb.
- **Remote Proctor Controls:** Remote Pause/Lock and Time Extensions.
