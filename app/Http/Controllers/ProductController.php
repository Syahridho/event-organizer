<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductRequest;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProductController extends Controller
{
    /**
     * Display a listing of the user's products.
     */
    public function index()
    {
        $products = Product::with('categories')
            ->where('user_id', Auth::id())
            ->latest()
            ->get();

        return Inertia::render('Mitra/Products/Index', [
            'products' => $products
        ]);
    }

    /**
     * Show the form for creating a new product.
     */
    public function create()
    {
        $categories = Category::active()->get();

        return Inertia::render('Mitra/Products/Create', [
            'categories' => $categories
        ]);
    }

    /**
     * Store a newly created product in storage.
     */
    public function store(ProductRequest $request)
    {
        $validated = $request->validated();
        $validated['user_id'] = Auth::id();

        $product = Product::create($validated);

        // Sync categories with validation
        if (!empty($validated['category_ids'])) {
            $this->syncCategories($product, $validated['category_ids']);
        }

        return redirect()->route('products.index')
            ->with('success', 'Produk berhasil dibuat');
    }

    /**
     * Show the form for editing the specified product.
     */
    public function edit(Product $product)
    {
        // Check if the product belongs to the authenticated user
        if ($product->user_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        $product->load('categories');
        $categories = Category::active()->get();

        return Inertia::render('Mitra/Products/Edit', [
            'product' => $product,
            'categories' => $categories
        ]);
    }

    /**
     * Update the specified product in storage.
     */
    public function update(ProductRequest $request, Product $product)
    {
        // Check if the product belongs to the authenticated user
        if ($product->user_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validated();

        $product->update($validated);

        // Sync categories with validation
        if (!empty($validated['category_ids'])) {
            $this->syncCategories($product, $validated['category_ids']);
        } else {
            $product->categories()->detach();
        }

        return redirect()->route('products.index')
            ->with('success', 'Produk berhasil diperbarui');
    }

    /**
     * Remove the specified product from storage.
     */
    public function destroy(Product $product)
    {
        // Check if the product belongs to the authenticated user
        if ($product->user_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        $product->delete();

        return redirect()->route('products.index')
            ->with('success', 'Produk berhasil dihapus');
    }

    /**
     * Sync categories with validation to ensure user owns all categories.
     */
    private function syncCategories(Product $product, array $categoryIds): void
    {
        // Validate that all category IDs belong to the authenticated user
        $validCategoryIds = Category::where('user_id', Auth::id())
            ->whereIn('id', $categoryIds)
            ->pluck('id')
            ->toArray();

        // Find invalid category IDs
        $invalidIds = array_diff($categoryIds, $validCategoryIds);

        if (!empty($invalidIds)) {
            throw new \Illuminate\Validation\ValidationException(
                validator()->make([], [])
                    ->errors()
                    ->add('category_ids', 'Some categories do not belong to you.')
            );
        }

        $product->categories()->sync($validCategoryIds);
    }
}