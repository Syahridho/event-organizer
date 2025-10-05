<?php

namespace App\Http\Controllers\Admin;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\AdminSetting;

class AdminSettingController extends Controller
{
    public function index()
    {
        $setting = AdminSetting::first();

        return Inertia::render('Admin/Settings/Index', [
            'setting' => $setting,
        ]);
    }

    public function update(Request $request)
    {
        $setting = AdminSetting::first();

        $validated = $request->validate([
            'site_name'     => 'required|string|max:255',
            'logo'          => 'nullable|string',
            'currency'      => 'required|string|max:10',
            'payment_time'  => 'required|integer|min:1',
            'tax_type'      => 'required|in:percent,fixed',
            'tax_value'     => 'required|numeric|min:0',
            'contact_email' => 'nullable|email',
            'contact_phone' => 'nullable|string',
            'address'       => 'nullable|string',
            'about_us'      => 'nullable|string',
        ]);

        $setting->update($validated);

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

        return redirect()->route('admin.settings.index');
    }
}
