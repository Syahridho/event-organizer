<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Teknologi',
                'slug' => 'teknologi',
                'description' => 'Acara terkait teknologi, startup, dan inovasi digital',
                'color' => '#3B82F6',
                'is_active' => true,
            ],
            [
                'name' => 'Bisnis',
                'slug' => 'bisnis',
                'description' => 'Seminar, workshop, dan konferensi bisnis',
                'color' => '#10B981',
                'is_active' => true,
            ],
            [
                'name' => 'Pendidikan',
                'slug' => 'pendidikan',
                'description' => 'Acara edukasi, pelatihan, dan pengembangan skills',
                'color' => '#F59E0B',
                'is_active' => true,
            ],
            [
                'name' => 'Hiburan',
                'slug' => 'hiburan',
                'description' => 'Konser, pertunjukan, dan acara hiburan lainnya',
                'color' => '#EF4444',
                'is_active' => true,
            ],
            [
                'name' => 'Olahraga',
                'slug' => 'olahraga',
                'description' => 'Kompetisi olahraga, marathon, dan kegiatan fitness',
                'color' => '#8B5CF6',
                'is_active' => true,
            ],
            [
                'name' => 'Kesehatan',
                'slug' => 'kesehatan',
                'description' => 'Seminar kesehatan, medical checkup, dan wellness',
                'color' => '#EC4899',
                'is_active' => true,
            ],
            [
                'name' => 'Seni & Budaya',
                'slug' => 'seni-budaya',
                'description' => 'Pameran seni, festival budaya, dan acara kreatif',
                'color' => '#14B8A6',
                'is_active' => true,
            ],
            [
                'name' => 'Sosial',
                'slug' => 'sosial',
                'description' => 'Acara amal, penggalangan dana, dan kegiatan sosial',
                'color' => '#F97316',
                'is_active' => true,
            ],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }
    }
}