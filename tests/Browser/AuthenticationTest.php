<?php

namespace Tests\Browser;

use App\Models\User;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class AuthenticationTest extends DuskTestCase
{
    /**
     * Test user registration.
     */
    public function test_user_can_register(): void
    {
        $email = 'john'.time().'@example.com';
        $this->browse(function (Browser $browser) use ($email) {
            $browser->visit('/register')
                ->type('name', 'John Instructor')
                ->type('email', $email)
                ->type('password', 'password123')
                ->type('password_confirmation', 'password123')
                ->click('[data-test="register-user-button"]')
                ->waitForLocation('/dashboard')
                ->assertPathIs('/dashboard')
                ->assertSee('John Instructor');
        });
    }

    /**
     * Test user login and logout.
     */
    public function test_user_can_login_and_logout(): void
    {
        $email = 'login'.time().'@example.com';
        $user = User::factory()->create([
            'email' => $email,
            'password' => bcrypt('password123'),
        ]);

        $this->browse(function (Browser $browser) use ($user) {
            // Ensure clean state
            $browser->logout()
                ->visit('/login')
                ->waitFor('input[name="email"]')
                ->type('email', $user->email)
                ->type('password', 'password123')
                ->click('[data-test="login-button"]')
                ->waitForLocation('/dashboard')
                ->assertPathIs('/dashboard')
                ->assertSee($user->name);

            // Logout
            $browser->click('[data-test="sidebar-menu-button"]')
                ->waitForText('Log out')
                ->click('[data-test="logout-button"]')
                ->waitForLocation('/')
                ->assertPathIs('/');
        });
    }

    /**
     * Test profile update.
     */
    public function test_user_can_update_profile(): void
    {
        $user = User::factory()->create();

        $this->browse(function (Browser $browser) use ($user) {
            $browser->loginAs($user)
                ->visit('/settings/profile')
                ->type('name', 'Updated Name')
                ->click('[data-test="update-profile-button"]')
                ->waitForText('Saved')
                ->refresh()
                ->assertInputValue('name', 'Updated Name');
        });
    }
}
