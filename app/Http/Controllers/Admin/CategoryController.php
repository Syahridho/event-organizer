<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        $query = Category::query()->withoutGlobalScope('user'); // Show all categories for admin

        // Search functionality
        if ($request->has('search') && $request->search !== '') {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $categories = $query->with('user')->latest()->paginate(10)->withQueryString();

        return Inertia::render('Admin/Categories/Index', [
            'categories' => $categories,
            'filters' => $request->only(['search', 'is_active']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Inertia\Response
     */
    public function create()
    {
        return Inertia::render('Admin/Categories/Create');
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories',
            'description' => 'nullable|string',
            'color' => 'required|string|max:7', // e.g., #ffffff
            'is_active' => 'boolean',
        ]);

        // Generate slug from name if not provided
        $validated['slug'] = Str::slug($validated['name']);
        // Set user_id to the currently authenticated admin
        $validated['user_id'] = Auth::id();

        Category::create($validated);

        return redirect()->route('admin.categories.index')
            ->with('success', 'Kategori berhasil dibuat.');
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  \App\Models\Category  $category
     * @return \Inertia\Response
     */
    public function edit(Category $category)
    {
        // Load the category without the global user scope for editing
        $category->load('user');

        return Inertia::render('Admin/Categories/Update', [
            'category' => $category,
        ]);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Category  $category
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name,' . $category->id,
            'slug' => 'required|string|max:255|unique:categories,slug,' . $category->id,
            'description' => 'nullable|string',
            'color' => 'required|string|max:7',
            'is_active' => 'boolean',
        ]);

        // Ensure slug is updated if name changes and slug is not manually provided
        if ($request->name !== $category->name && !$request->filled('slug')) {
            $validated['slug'] = Str::slug($request->name);
        }

        $category->update($validated);

        return redirect()->route('admin.categories.index')
            ->with('success', 'Kategori berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\Category  $category
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(Category $category)
    {
        // Optional: Check if category has related items before deleting
        // if ($category->services()->exists() || $category->buildings()->exists() || $category->rentProperties()->exists()) {
        //     return redirect()->back()->withErrors(['error' => 'Kategori tidak dapat dihapus karena masih memiliki item terkait.']);
        // }

        $category->delete();

        return redirect()->route('admin.categories.index')
            ->with('success', 'Kategori berhasil dihapus.');
    }

    /**
     * API endpoint for searching categories (used in frontend dropdowns).
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function apiSearch(Request $request)
    {
        $query = Category::query()->withoutGlobalScope('user')->active(); // Only active categories

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $categories = $query->latest()->get(['id', 'name', 'color']);

        return response()->json([
            'categories' => $categories
        ]);
    }
}