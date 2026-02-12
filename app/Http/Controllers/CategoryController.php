<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CategoryController extends Controller
{
    /**
     * Display a listing of the user's categories.
     */
    public function index()
    {
        $categories = Category::active()->get();

        return Inertia::render('Mitra/Categories/Index', [
            'categories' => $categories
        ]);
    }

    /**
     * Show the form for creating a new category.
     */
    public function create()
    {
        return Inertia::render('Mitra/Categories/Create');
    }

    /**
     * Store a newly created category in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'color' => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
            'is_active' => 'boolean',
        ]);

        // Generate unique slug for this user
        $slug = Str::slug($validated['name']);
        $originalSlug = $slug;
        $counter = 1;

        while (Category::where('user_id', Auth::id())->where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        $validated['slug'] = $slug;
        $validated['user_id'] = Auth::id();
        $validated['is_active'] = $validated['is_active'] ?? true;

        Category::create($validated);

        return redirect()->route('categories.index')
            ->with('success', 'Kategori berhasil dibuat');
    }

    /**
     * Show the form for editing the specified category.
     */
    public function edit(Category $category)
    {
        // Check if the category belongs to the authenticated user
        if (!$category->belongsToAuthenticatedUser()) {
            abort(403, 'Unauthorized action.');
        }

        return Inertia::render('Mitra/Categories/Edit', [
            'category' => $category
        ]);
    }

    /**
     * Update the specified category in storage.
     */
    public function update(Request $request, Category $category)
    {
        // Check if the category belongs to the authenticated user
        if (!$category->belongsToAuthenticatedUser()) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'color' => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
            'is_active' => 'boolean',
        ]);

        // Generate unique slug for this user (if name changed)
        if ($validated['name'] !== $category->name) {
            $slug = Str::slug($validated['name']);
            $originalSlug = $slug;
            $counter = 1;

            while (Category::where('user_id', Auth::id())
                ->where('slug', $slug)
                ->where('id', '!=', $category->id)
                ->exists()) {
                $slug = $originalSlug . '-' . $counter;
                $counter++;
            }

            $validated['slug'] = $slug;
        }

        $validated['is_active'] = $validated['is_active'] ?? true;

        $category->update($validated);

        return redirect()->route('categories.index')
            ->with('success', 'Kategori berhasil diperbarui');
    }

    /**
     * Remove the specified category from storage.
     */
    public function destroy(Category $category)
    {
        // Check if the category belongs to the authenticated user
        if (!$category->belongsToAuthenticatedUser()) {
            abort(403, 'Unauthorized action.');
        }

        // Check if category is being used by any products
        if ($category->products()->exists()) {
            return redirect()->route('categories.index')
                ->with('error', 'Kategori tidak dapat dihapus karena masih digunakan oleh produk.');
        }

        $category->delete();

        return redirect()->route('categories.index')
            ->with('success', 'Kategori berhasil dihapus');
    }

    /**
     * Get user's categories as JSON (for API usage).
     */
    public function apiIndex(Request $request)
    {
        $categories = Category::active()
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->get(['id', 'name', 'color']);

        return response()->json([
            'categories' => $categories
        ]);
    }

    /**
     * Validate category IDs to ensure they belong to the authenticated user.
     */
    public static function validateUserCategoryIds(array $categoryIds): array
    {
        if (empty($categoryIds)) {
            return [];
        }

        $userCategories = Category::where('user_id', Auth::id())
            ->whereIn('id', $categoryIds)
            ->pluck('id')
            ->toArray();

        // Find invalid category IDs
        $invalidIds = array_diff($categoryIds, $userCategories);

        if (!empty($invalidIds)) {
            throw new \Illuminate\Validation\ValidationException(
                validator()->make([], [])
                    ->errors()
                    ->add('category_ids', 'Some categories do not belong to you.')
            );
        }

        return $userCategories;
    }
}