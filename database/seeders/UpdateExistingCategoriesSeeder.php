<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\User;

class UpdateExistingCategoriesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all categories that don't have user_id
        $categoriesWithoutUser = Category::withoutGlobalScope('user')
            ->whereNull('user_id')
            ->get();

        if ($categoriesWithoutUser->count() > 0) {
            // Get the first user (or create a default user)
            $defaultUser = User::first();
            
            if (!$defaultUser) {
                $this->command->error('No users found in the database. Please create a user first.');
                return;
            }

            // Update all existing categories to belong to the first user
            Category::withoutGlobalScope('user')
                ->whereNull('user_id')
                ->update(['user_id' => $defaultUser->id]);

            $this->command->info("Updated {$categoriesWithoutUser->count()} categories to belong to user ID: {$defaultUser->id}");
        } else {
            $this->command->info('All categories already have user_id set.');
        }
    }
}