<?php
namespace App\Http\Controllers;

use App\Models\Addresses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AddressController extends Controller
{
    public function index()
    {
        $addresses = Addresses::where('user_id', Auth::id())->get();
        return inertia('Addresses/Index', ['addresses' => $addresses]);
    }

    public function getAddresses()
    {
        return response()->json([
            'data' => Addresses::where('user_id', Auth::id())->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'label' => 'nullable|string|max:255',
            'recipient_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'address_line' => 'required|string|max:500',
            'province' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'district' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:10',
            'note' => 'nullable|string|max:500',
            'is_default' => 'boolean',
        ]);

        if ($validated['is_default']) {
            Addresses::where('user_id', Auth::id())->update(['is_default' => false]);
        }

        $address = Addresses::create(array_merge($validated, ['user_id' => Auth::id()]));

        return response()->json(['data' => $address]);
    }

    public function update(Request $request, $id)
    {
        $address = Addresses::where('user_id', Auth::id())->findOrFail($id);

        $validated = $request->validate([
            'label' => 'nullable|string|max:255',
            'recipient_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'address_line' => 'required|string|max:500',
            'province' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'district' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:10',
            'note' => 'nullable|string|max:500',
            'is_default' => 'boolean',
        ]);

        if ($validated['is_default']) {
            Addresses::where('user_id', Auth::id())->update(['is_default' => false]);
        }

        $address->update($validated);

        return response()->json(['data' => $address]);
    }

    public function destroy($id)
    {
        $address = Addresses::where('user_id', Auth::id())->findOrFail($id);
        $address->delete();

        return response()->json(['message' => 'Alamat berhasil dihapus']);
    }

    public function setDefault($id)
    {
        Addresses::where('user_id', Auth::id())->update(['is_default' => false]);
        $address = Addresses::where('user_id', Auth::id())->findOrFail($id);
        $address->update(['is_default' => true]);

        return response()->json(['message' => 'Alamat default berhasil diatur']);
    }
}