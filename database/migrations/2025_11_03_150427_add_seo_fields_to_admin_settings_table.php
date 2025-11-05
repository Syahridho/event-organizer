<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('admin_settings', function (Blueprint $table) {
            $table->string('seo_title', 60)->nullable();
            $table->text('seo_description')->nullable();
            $table->string('seo_keywords')->nullable();
            $table->string('seo_image')->nullable();
            $table->enum('seo_twitter_card', ['summary', 'summary_large_image'])->default('summary');
            $table->enum('seo_og_type', ['website', 'article'])->default('website');
            $table->string('seo_canonical_url')->nullable();
            $table->enum('seo_robots', ['index', 'follow', 'noindex', 'nofollow'])->default('index');
            $table->string('seo_author')->nullable();
            $table->string('seo_publisher')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('admin_settings', function (Blueprint $table) {
            $table->dropColumn([
                'seo_title',
                'seo_description',
                'seo_keywords',
                'seo_image',
                'seo_twitter_card',
                'seo_og_type',
                'seo_canonical_url',
                'seo_robots',
                'seo_author',
                'seo_publisher',
            ]);
        });
    }
};
