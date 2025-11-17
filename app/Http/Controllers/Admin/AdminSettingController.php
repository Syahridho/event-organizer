<?php

namespace App\Http\Controllers\Admin;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\AdminSetting;
use App\Helpers\TaxHelper;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Laravel\Facades\Image;

class AdminSettingController extends Controller
{
    public function index()
    {
        $setting = AdminSetting::first();

        return Inertia::render('Admin/Settings/Index', [
            'setting' => $setting,
        ]);
    }

    public function store(Request $request)
    {
        $setting = AdminSetting::firstOrCreate([]);
    
        $validated = $request->validate([
            'site_name'     => 'nullable|string|max:255',
            'logo'          => 'nullable|string',
            'currency'      => 'nullable|string|max:10',
            'payment_time'  => 'nullable|integer|min:1',
            'tax_type'      => 'nullable|in:percent,fixed',
            'tax_value'     => 'nullable|numeric|min:0',
            'contact_email' => 'nullable|email',
            'contact_phone' => 'nullable|string',
            'address'       => 'nullable|string',
            'about_us'      => 'nullable|string',
            'seo_title'     => 'nullable|string|max:60',
            'seo_description' => 'nullable|string|max:160',
            'seo_keywords'  => 'nullable|string',
            'seo_author'    => 'nullable|string',
            'seo_publisher' => 'nullable|string',
            'maintenance_mode' => 'boolean',
        ]);
    
        if ($request->hasFile('newlogo')) {
            $request->validate([
                'newlogo' => 'image|mimes:jpeg,png,jpg,webp|max:2048',
            ]);

            if ($setting->logo) {
                Storage::disk('public')->delete('seo/' . $setting->logo);
            }

            // Convert to PNG favicon-sized 32x32 using Intervention Image v3 API
            $filename = uniqid() . '.png';

            $processed = Image::read($request->file('newlogo'))
                ->cover(32, 32) // crop+fit to 32x32 for favicon without distortion
                ->toPng();      // encode to PNG

            Storage::disk('public')->put('seo/' . $filename, (string) $processed);

            $validated['logo'] = $filename;
        }
       
        $setting->update($validated);
    
        TaxHelper::clearCache();
        Cache::forget('admin_dashboard_data');
    
        return redirect()->back()->with('success', 'Pengaturan berhasil diperbarui!');
    }

    public function updateTax(Request $request)
    {
        $validated = $request->validate([
            'tax_type' => 'required|in:percent,fixed',
            'tax_value' => 'required|numeric|min:0',
        ]);

        $setting = AdminSetting::first();
        $setting->update($validated);

        // Clear cache when tax updated
        TaxHelper::clearCache();
        Cache::forget('admin_dashboard_data');

        return redirect()->route('admin.settings.index')->with('success', 'Pajak berhasil diperbarui!');
    }

    public function updateHero(Request $request)
    {
        $request->validate([
            'hero_image' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048', // Maks 2MB
        ]);

        $setting = AdminSetting::firstOrCreate([]);

        if ($setting->seo_image) {
            Storage::disk('public')->delete('seo/' . $setting->seo_image);
        }

        $path = $request->file('hero_image')->store('seo', 'public');

        $filename = basename($path);

        $setting->update([
            'seo_image' => $filename,
        ]);

        return redirect()->back()->with('success', 'Tampilan hero berhasil diperbarui.');
    }

    public function updateMaintenance(Request $request)
    {
        $setting = AdminSetting::first();
    
        $validated = $request->validate([
            'maintenance_mode' => 'boolean',
        ]);

        $setting->update($validated);
    
        TaxHelper::clearCache();
        Cache::forget('admin_dashboard_data');
    
        return redirect()->back()->with('success', 'Mode Pemeliharaan Diperbarui');
    }

    public function updateDefaultEventImage(Request $request)
    {
        $request->validate([
            'default_event_image' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048', // Max 2MB
        ]);

        $setting = AdminSetting::firstOrCreate([]);
        
        // Get existing images or initialize empty array
        $existingImages = $setting->default_image_event ?? [];
        
        // Generate unique filename
        $filename = uniqid() . '.' . $request->file('default_event_image')->getClientOriginalExtension();
        
        // Store file in random directory
        $path = $request->file('default_event_image')->store('default-event-images', 'public');
        
        // Add new image to array
        $newImage = [
            'id' => uniqid(),
            'filename' => basename($path),
            'path' => $path,
            'created_at' => now()->toISOString()
        ];
        
        $existingImages[] = $newImage;
        
        // Update setting with JSON array
        $setting->update([
            'default_image_event' => $existingImages,
        ]);

        return redirect()->back()->with('success', 'Gambar default event berhasil ditambahkan.');
    }

    public function deleteDefaultEventImage(Request $request)
    {
        $request->validate([
            'image_id' => 'required|string',
        ]);

        $setting = AdminSetting::first();
        
        if (!$setting || !$setting->default_image_event) {
            return response()->json(['error' => 'No default event images found'], 404);
        }
        
        $images = $setting->default_image_event;
        $imageToDelete = null;
        
        // Find image to delete
        foreach ($images as $index => $image) {
            if ($image['id'] === $request->image_id) {
                $imageToDelete = $image;
                unset($images[$index]);
                break;
            }
        }
        
        if ($imageToDelete) {
            // Delete file from storage
            Storage::disk('public')->delete($imageToDelete['path']);
            
            // Update setting with remaining images
            $setting->update([
                'default_image_event' => array_values($images), // Re-index array
            ]);
            
            return redirect()->back()->with(['success' => 'Gambar berhasil dihapus']);
        }
        
        return redirect()->back()->with(['error' => 'Image not found'], 404);
    }
}
