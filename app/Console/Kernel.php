<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     *
     * OPTIMIZED: Auto-cleanup sold-out cart items every 5 minutes
     * Prevents users from attempting to checkout items that are already booked by others
     */
    protected function schedule(Schedule $schedule): void
    {
        // Clean up sold-out cart items every 5 minutes
        $schedule->command('cart:cleanup-sold-out')
            ->everyFiveMinutes()
            ->withoutOverlapping()
            ->onOneServer();

        // Auto-update expired transactions every minute (mass update to 'overtime')
        $schedule->command('transactions:check-expired')
            ->everyMinute()
            ->withoutOverlapping()
            ->onOneServer();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
