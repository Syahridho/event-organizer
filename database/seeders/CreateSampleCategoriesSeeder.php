<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\User;

class CreateSampleCategoriesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the first user for testing
        $user = User::first();
        
        if (!$user) {
            $this->command->error('No users found in the database. Please create a user first.');
            return;
        }

        $sampleCategories = [
            [
                'name' => 'Teknologi',
                'slug' => 'teknologi',
                'description' => 'Acara terkait teknologi, startup, dan inovasi digital',
                'color' => '#3B82F6',
                'is_active' => true,
                'user_id' => $user->id,
            ],
            [
                'name' => 'Bisnis',
                'slug' => 'bisnis',
                'description' => 'Seminar, workshop, dan konferensi bisnis',
                'color' => '#10B981',
                'is_active' => true,
                'user_id' => $user->id,
            ],
            [
                'name' => 'Pendidikan',
                'slug' => 'pendidikan',
                'description' => 'Acara edukasi, pelatihan, dan pengembangan skills',
                'color' => '#F59E0B',
                'is_active' => true,
                'user_id' => $user->id,
            ],
            [
                'name' => 'Hiburan',
                'slug' => 'hiburan',
                'description' => 'Konser, pertunjukan, dan acara hiburan lainnya',
                'color' => '#EF4444',
                'is_active' => true,
                'user_id' => $user->id,
            ],
            [
                'name' => 'Olahraga',
                'slug' => 'olahraga',
                'description' => 'Kompetisi olahraga, marathon, dan kegiatan fitness',
                'color' => '#8B5CF6',
                'is_active' => true,
                'user_id' => $user->id,
            ],
        ];

        foreach ($sampleCategories as $category) {
            // Check if category already exists for this user
            $existing = Category::withoutGlobalScope('user')
                ->where('user_id', $user->id)
                ->where('slug', $category['slug'])
                ->first();

            if (!$existing) {
                Category::withoutGlobalScope('user')->create($category);
                $this->command->info("Created category: {$category['name']} for user ID: {$user->id}");
            } else {
                $this->command->info("Category already exists: {$category['name']}");
            }
        }
    }
}