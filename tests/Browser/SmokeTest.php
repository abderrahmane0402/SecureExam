<?php

use Laravel\Dusk\Browser;

describe('Smoke Test', function () {
    it('loads the landing page', function () {
        $this->browse(function (Browser $browser) {
            $browser->visit('/')
                ->waitForText('ExamSecure')
                ->assertSee('ExamSecure');
        });
    });

    it('loads the login page', function () {
        $this->browse(function (Browser $browser) {
            $browser->visit('/login')
                ->waitForText('Log in to your account')
                ->assertSee('Log in to your account');
        });
    });

    it('loads the registration page', function () {
        $this->browse(function (Browser $browser) {
            $browser->visit('/register')
                ->waitForText('Create an account')
                ->assertSee('Create an account');
        });
    });

    it('loads the instructor dashboard', function () {
        $instructor = createInstructor();

        $this->browse(function (Browser $browser) use ($instructor) {
            $browser->loginAs($instructor)
                ->visit('/dashboard')
                ->waitForText('Dashboard')
                ->assertSee('Welcome back');
        });
    });

    it('loads the student exams list', function () {
        $student = createStudent();

        $this->browse(function (Browser $browser) use ($student) {
            $browser->loginAs($student)
                ->visit('/student/exams')
                ->waitForText('My Exams')
                ->assertSee('My Exams');
        });
    });

    it('loads settings pages', function () {
        $user = createInstructor();

        $this->browse(function (Browser $browser) use ($user) {
            $browser->loginAs($user)
                ->visit('/settings/profile')
                ->waitForText('Profile information')
                ->assertSee('Profile information')
                ->visit('/settings/password')
                ->waitForText('Update password')
                ->assertSee('Update password');
        });
    });
});
