<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Testimonial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class TestimonialController extends Controller
{
    public function index()
    {
        $testimonials = Testimonial::orderBy('created_at', 'desc')->get();

        return Inertia::render('Admin/Testimonials/Index', [
            'testimonials' => $testimonials,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'author_name' => 'required|string|max:255',
            'author_title' => 'required|string|max:255',
            'quote' => 'required|string',
            'star_rating' => 'required|integer|min:1|max:5',
            'author_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($request->hasFile('author_image')) {
            $path = $request->file('author_image')->store('testimonials', 'public');
            $validated['author_image_url'] = Storage::url($path);
        }

        Testimonial::create($validated);

        return redirect()->route('admin.testimonials.index')->with('success', 'Testimonial created successfully');
    }

    public function update(Request $request, Testimonial $testimonial)
    {
        $validated = $request->validate([
            'author_name' => 'required|string|max:255',
            'author_title' => 'required|string|max:255',
            'quote' => 'required|string',
            'star_rating' => 'required|integer|min:1|max:5',
            'author_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);


        if ($request->hasFile('author_image')) {
            // Delete old image if exists
            if ($testimonial->author_image_url) {
                $oldPath = str_replace('/storage/', '', $testimonial->author_image_url);
                Storage::disk('public')->delete($oldPath);
            }

            $path = $request->file('author_image')->store('testimonials', 'public');
            $validated['author_image_url'] = Storage::url($path);
        }

        $testimonial->update($validated);

        return redirect()->route('admin.testimonials.index')->with('success', 'Testimonial updated successfully');
    }

    public function destroy(Testimonial $testimonial)
    {
        // Delete image if exists
        if ($testimonial->author_image_url) {
            $path = str_replace('/storage/', '', $testimonial->author_image_url);
            Storage::disk('public')->delete($path);
        }

        $testimonial->delete();

        return redirect()->route('admin.testimonials.index')->with('success', 'Testimonial deleted successfully');
    }
}