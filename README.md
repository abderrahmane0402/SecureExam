# Secure Online Exam System

A comprehensive and secure examination platform designed for educational institutions, featuring anti-cheating measures, real-time monitoring, automatic grading, and multi-language support.

## 🚀 Tech Stack

- **Backend**: [Laravel 12](https://laravel.com) (PHP 8.4)
- **Frontend**: [Inertia.js v2](https://inertiajs.com) ([React 19](https://react.dev), TypeScript)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com)
- **Real-time**: [Laravel Reverb](https://reverb.laravel.com)
- **Authentication**: [Laravel Fortify](https://laravel.com/docs/fortify)
- **Routing**: [Laravel Wayfinder](https://github.com/laravel/wayfinder)
- **Testing**: [Pest PHP v4](https://pestphp.com)

## 🛠 Prerequisites

Ensure you have the following installed on your local machine:

- **PHP 8.4+**
- **Composer**
- **Node.js 20+** & **npm**
- **SQLite** (Default) or MySQL/PostgreSQL

## 📥 Installation

Follow these steps to get the project running locally:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/examen_app.git
    cd examen_app
    ```

2.  **Install PHP dependencies:**
    ```bash
    composer install
    ```

3.  **Install JavaScript dependencies:**
    ```bash
    npm install
    ```

4.  **Environment Setup:**
    ```bash
    cp .env.example .env
    php artisan key:generate
    ```
    *Configure your database settings in `.env` if not using the default SQLite.*

5.  **Run Migrations and Seeders:**
    ```bash
    php artisan migrate --seed
    ```

## 🔐 Default Credentials

After seeding the database, you can log in with the following accounts:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Instructor** | `teacher@example.com` | `password` |
| **Student** | `student@example.com` | `password` |

## 💻 Development

The project includes a convenient script to start all necessary services (Server, Queue, Reverb, Scheduler, and Vite):

```bash
composer run dev
```

### Manual Service Start
If you prefer to run services individually, ensure the following are active:

- **Vite (Frontend):** `npm run dev`
- **Artisan Server:** `php artisan serve`
- **Reverb (WebSockets):** `php artisan reverb:start`
- **Queue Worker:** `php artisan queue:listen`
- **Task Scheduler:** `php artisan schedule:work` (Critical for auto-submitting expired exams)

## 🛡 Security Features (Anti-Cheating)

This system implements rigorous anti-cheating measures during exams:

- **Fullscreen Enforcement**: Exams must be taken in fullscreen mode. Exiting triggers a violation.
- **Tab/Window Monitoring**: Losing focus or switching tabs triggers violations and can lock the exam.
- **Copy/Paste Prevention**: `copy`, `paste`, and `cut` events are strictly blocked and logged.
- **ContextMenu Blocking**: Right-click is disabled to prevent inspector access.
- **Away Time Tracking**: Cumulative time spent away from the exam window is tracked; exceeding 15 seconds triggers auto-submission.
- **Heartbeat System**: Real-time validation of student presence and connection.

## 🧪 Testing

We use Pest for unit and feature testing.

```bash
# Run all tests
php artisan test

# Run tests with compact output
php artisan test --compact
```

## 🌍 Multi-Language Support

The application supports **English (`en`)** and **French (`fr`)**. Translations are managed via the `useLanguage` hook in the React frontend.

## 📄 License

This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
