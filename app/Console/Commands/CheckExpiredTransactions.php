<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Transaction;
use Carbon\Carbon;

class CheckExpiredTransactions extends Command
{
    /**
     * Command signature:
     * - status: base status to check (default: pending)
     * - expired: target status when expired (default: overtime)
     */
    protected $signature = 'transactions:check-expired 
                            {--status=pending : Base status to check for expiration} 
                            {--expired=overtime : Status to set when expired}';

    protected $description = 'Checks for and updates expired transactions based on expired_at using a mass update.';

    public function handle(): int
    {
        $baseStatus = (string) $this->option('status') ?: 'pending';
        $expiredStatus = (string) $this->option('expired') ?: 'overtime';
        $now = Carbon::now();

        // Fastest algorithm: single mass update query
        $updatedCount = Transaction::where('status', $baseStatus)
            ->whereNotNull('expired_at')
            ->where('expired_at', '<=', $now)
            ->update([
                'status' => $expiredStatus,
                'updated_at' => $now,
            ]);

        $this->info("Successfully updated {$updatedCount} transaction(s) from '{$baseStatus}' to '{$expiredStatus}'.");

        return Command::SUCCESS;
    }
}