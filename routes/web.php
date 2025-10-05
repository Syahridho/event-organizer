<?php

use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Http; // ADDED: Missing import for RajaOngkir API
use Illuminate\Support\Facades\Storage; // TAMBAHKAN INI

use App\Models\Mitra;


use App\Http\Controllers\MidtransController;

use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\AdminSettingController;
use App\Http\Controllers\Admin\BuildingController as AdminBuildingController;
use App\Http\Controllers\Admin\EventController as AdminEventController;
use App\Http\Controllers\Admin\RentController as AdminRentController;
use App\Http\Controllers\Admin\ServiceController as AdminServiceController;
use App\Http\Controllers\Admin\WithdrawController as AdminWithdrawController;
use App\Http\Controllers\Admin\PartnerController as AdminPartnerController;

use App\Http\Controllers\Mitra\MitraController;
use App\Http\Controllers\Mitra\MitraTransactionController;
use App\Http\Controllers\Mitra\WithDrawController;
use App\Http\Controllers\Mitra\RatingController;

use App\Http\Controllers\PartnerController;
use App\Http\Controllers\BuildingController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ListingController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\RentController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\AddressController;
use App\Http\Controllers\LeaveController; 
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\TicketController;


// Main homepage
Route::get('/', [HomeController::class, 'index'])->name('welcome');

// Product listing pages
Route::get('/tickets', [ListingController::class, 'listEvent'])->name('home.tickets');
Route::get('/services', [ListingController::class, 'listService'])->name('home.services');
Route::get('/buildings', [ListingController::class, 'listBuilding'])->name('home.buildings');
Route::get('/properties', [ListingController::class, 'listProperty'])->name('home.properties'); // FIXED: Changed from /propertys to /properties

// Search functionality
Route::get('/search', [HomeController::class, 'search'])->name('search');

// POSSIBLE DUPLICATE: Check if this is different from route '/'
Route::get('/home', [ListingController::class, 'index'])->name('home');
Route::get('/home/json', [ListingController::class, 'indexJson'])->name('home.json'); // POSSIBLE LEGACY: Consider if still needed

// Product detail pages
Route::get('/events/{id}', [HomeController::class, 'showEvent'])->name('events.show');
Route::get('/services/{id}', [HomeController::class, 'showService'])->name('services.show');
Route::get('/buildings/{id}', [HomeController::class, 'showBuilding'])->name('buildings.show');
Route::get('/properties/{id}', [HomeController::class, 'showProperty'])->name('properties.show'); // FIXED: Changed from /propertys

// Midtrans payment routes
Route::middleware(['auth'])->group(function () {
    Route::post('/midtrans/token', [MidtransController::class, 'createSnapToken']);
    Route::get('/midtrans/status/{orderId}', [MidtransController::class, 'checkTransactionStatus']);
    Route::post('/transaction/cancel/{orderId}', [MidtransController::class, 'cancelTransaction'])->name('transaction.cancel');
});

// Midtrans callback routes (no auth required, CSRF disabled)
Route::withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class])->group(function () {
    Route::post('/midtrans/callback', [MidtransController::class, 'callback'])->name('midtrans.callback');
});

Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.readAll');
Route::post('/notifications', [NotificationController::class, 'store'])->name('notifications.store');


// Midtrans redirect routes
Route::get('/midtrans/finish', [MidtransController::class, 'finish'])->name('midtrans.finish');
Route::get('/midtrans/error', [MidtransController::class, 'error'])->name('midtrans.error');
Route::get('/midtrans/unfinish', [MidtransController::class, 'unfinish'])->name('midtrans.unfinish');

// Authenticated user routes
Route::middleware(['auth', 'verified'])->group(function () {    
    

    Route::post('/partner/register', [PartnerController::class, 'store'])->name('partner.store');
    Route::get('/partner/register', [PartnerController::class, 'create'])->name('partner.create');

    Route::post('/tickets/check-availability', [TicketController::class, 'checkAvailability'])->name('tickets.check-availability');

    // Address management
    Route::get('/addresses', [AddressController::class, 'index'])->name('addresses.index');
    Route::get('/addresses/ajax/get', [AddressController::class, 'getAddresses']);
    Route::post('/addresses/ajax/store', [AddressController::class, 'store']);
    Route::put('/addresses/ajax/{id}', [AddressController::class, 'update']);
    Route::delete('/addresses/ajax/{id}', [AddressController::class, 'destroy']);
    Route::put('/addresses/{id}/set-default', [AddressController::class, 'setDefault']);

    // RajaOngkir API routes
    Route::get('/rajaongkir/provinces', function () {
        try {
            $response = Http::withHeaders([
                'key' => env('RAJAONGKIR_API_KEY')
            ])->get('https://rajaongkir.komerce.id/api/v1/destination/province'); 
            return $response->json();
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal memuat provinsi: ' . $e->getMessage()], 500);
        }
    });

    Route::get('/rajaongkir/cities/{provinceId}', function ($provinceId) {
        try {
            $response = Http::withHeaders([
                'key' => env('RAJAONGKIR_API_KEY')
            ])->get('https://rajaongkir.komerce.id/api/v1/destination/city', [
                'province' => $provinceId
            ]);
            return $response->json();
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal memuat kota: ' . $e->getMessage()], 500);
        }
    });

    Route::get('/rajaongkir/districts/{cityId}', function ($cityId) {
        try {
            $response = Http::withHeaders([
                'key' => env('RAJAONGKIR_API_KEY')
            ])->get('https://rajaongkir.komerce.id/api/v1/destination/district', [ // FIXED: Changed endpoint from province to district
                'city' => $cityId
            ]);
            return $response->json();
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal memuat kecamatan: ' . $e->getMessage()], 500);
        }
    });

    // Cart management
    Route::delete('/cart/clear-after-checkout', [CartController::class, 'clearAfterCheckout']);
    Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
    Route::post('/cart', [CartController::class, 'store'])->name('cart.store');
    Route::put('/cart/{id}', [CartController::class, 'update'])->name('cart.update');
    Route::delete('/cart/{id}', [CartController::class, 'destroy'])->name('cart.destroy');

    // Purchase history and management
    Route::prefix('purchase')->name('purchase.')->group(function () {
        Route::get('/', [PurchaseController::class, 'index'])->name('index');
        Route::get('/unpaid', [PurchaseController::class, 'unpaid'])->name('unpaid');
        Route::get('/paid', [PurchaseController::class, 'paid'])->name('paid');
        Route::get('/shipped', [PurchaseController::class, 'shipped'])->name('shipped');
        Route::get('/completed', [PurchaseController::class, 'completed'])->name('completed');
        Route::get('/cancelled', [PurchaseController::class, 'cancelled'])->name('cancelled');
        Route::get('/{id}', [PurchaseController::class, 'show'])->name('show');
    });

    // Checkout process
    Route::get('/checkout', [CheckoutController::class, 'index'])->name('checkout.index');
    Route::post('/event/free', [EventController::class, 'eventFree'])->name('event.free');
    Route::post('/checkout', [CheckoutController::class, 'show'])->name('checkout.show');

    Route::post('/rating/{orderId}', [RatingController::class, 'store'])->name('mitra.rating.store');

    // Admin routes
    Route::middleware(['role:admin'])->group(function () {
        Route::get('/admin/dashboard', [AdminController::class, 'index'])->name('admin.index');

        Route::get('/admin/settings', [AdminSettingController::class, 'index'])->name('admin.settings.index');
        Route::post('/admin/settings', [AdminSettingController::class, 'store'])->name('admin.settings.store');

        Route::post('/admin/settings/tax', [AdminSettingController::class, 'updateTax'])->name('admin.settings.tax.update');

        Route::get('/admin/dashboard/events', [AdminEventController::class, 'index'])->name('admin.events.dashboard');
        Route::put('/admin/events/{id}/banned', [AdminEventController::class, 'banned'])->name('admin.events.banned');

        Route::get('/admin/dashboard/services', [AdminServiceController::class, 'index'])->name('admin.services.dashboard');
        Route::put('/admin/services/{id}/banned', [AdminServiceController::class, 'banned'])->name('admin.services.banned');

        Route::get('/admin/dashboard/buildings', [AdminBuildingController::class, 'index'])->name('admin.buildings.dashboard');
        Route::put('/admin/buildings/{id}/banned', [AdminBuildingController::class, 'banned'])->name('admin.buildings.banned');

        Route::get('/admin/dashboard/rents', [AdminRentController::class, 'index'])->name('admin.rents.dashboard');
        Route::put('/admin/rents/{id}/banned', [AdminRentController::class, 'banned'])->name('admin.rents.banned');

        Route::get('/admin/withdraw', [AdminWithdrawController::class, 'index'])->name('admin.withdraw.index');
        Route::post('/admin/withdraw/{id}/complete', [AdminWithdrawController::class, 'markAsCompleted'])->name('admin.withdraw.complete');
        Route::post('/admin/withdraw/{id}/reject', [AdminWithdrawController::class, 'markAsRejected'])->name('admin.withdraw.reject');

        Route::get('/admin/mitra', [AdminPartnerController::class, 'index'])->name('admin.partners.index');

        Route::post('/admin/partners/{mitra}/approve', [AdminPartnerController::class, 'approve'])->name('admin.partners.approve');
        Route::post('/admin/partners/{mitra}/reject', [AdminPartnerController::class, 'reject'])->name('admin.partners.reject');    

        Route::get('/admin/partners/{mitra}/view-pdf/{type}', [AdminPartnerController::class, 'viewPdf'])->name('admin.partners.view-pdf');
        Route::get('/admin/partners/{mitra}/download-pdf/{type}', [AdminPartnerController::class, 'downloadPdf'])->name('admin.partners.download-pdf');

    });

    // Mitra (partner) routes
    Route::middleware(['role:mitra'])->group(function () {
        Route::get('/dashboard', [MitraController::class, 'dashboard'])->name('mitra.dashboard');

        Route::resource('/dashboard/events', EventController::class);
        Route::resource('/dashboard/services', ServiceController::class);
        Route::resource('/dashboard/buildings', BuildingController::class);
        Route::resource('/dashboard/rents', RentController::class);

        // Route::get('/dashboard/purchases', [PurchaseController::class, 'mitraIndex'])->name('mitra.purchases.index');
         // Main leave routes
        Route::get('/dashboard/leaves', [LeaveController::class, 'index'])->name('leaves.index');
        Route::get('/dashboard/leaves/services', [LeaveController::class, 'indexService'])->name('leaves.services.index');
        Route::get('/dashboard/leaves/services/{id}', [LeaveController::class, 'showService'])->name('leaves.services.show');
        
        Route::get('/dashboard/leaves/{itemId}', [LeaveController::class, 'show'])->name('leaves.show');

        Route::post('/leaves/toggle-weekly', [LeaveController::class, 'toggleWeekly'])->name('leaves.toggle-weekly');
        Route::post('/transactions/check-date', [LeaveController::class, 'checkTransactionsOnDate'])->name('transactions.check-date');
        Route::get('/leaves/stats', [LeaveController::class, 'getStats'])->name('leaves.stats');
        Route::post('/leaves/bulk', [LeaveController::class, 'storeBulk'])->name('leaves.bulk.store');
        Route::delete('/leaves/bulk', [LeaveController::class, 'destroyBulk'])->name('leaves.bulk.destroy');
        Route::post('/transactions/check-weekly', [LeaveController::class, 'checkWeekly'])->name('transactions.check-weekly');

        Route::get('/dashboard/transactions', [MitraTransactionController::class, 'index'])->name('mitra.transaction.index');

        Route::post('/mitra/transactions/{transactionItem}/confirm', [MitraTransactionController::class, 'confirm'])->name('mitra.transactions.confirm');
        Route::post('/mitra/transactions/{transactionItem}/cancel', [MitraTransactionController::class, 'cancel'])->name('mitra.transactions.cancel');
        Route::post('/mitra/transactions/{transactionItem}/otw', [MitraTransactionController::class, 'otw'])->name('mitra.transactions.otw');
        Route::post('/mitra/transactions/{transactionItem}/process', [MitraTransactionController::class, 'process'])->name('mitra.transactions.process');
        Route::post('/mitra/transactions/{transactionItem}/work', [MitraTransactionController::class, 'work'])->name('mitra.transactions.work');
        Route::post('/mitra/transactions/{transactionItem}/complete', [MitraTransactionController::class, 'complete'])->name('mitra.transactions.complete');

        Route::get('/dashboard/notifications', [NotificationController::class, 'showMitra'])->name('notification.mitra');
        Route::get('/dashboard/chat', [ChatController::class, 'mitraChat'])->name('mitra.chat');
        Route::get('/dashboard/chat/{user:uuid}', [ChatController::class, 'mitraShow'])->name('mitra.chat.show');

        Route::get('/dashboard/withdraw',[WithDrawController::class, 'index'])->name('mitra.withdraw.index');
        Route::post('/mitra/withdraw', [WithDrawController::class, 'store'])->name('mitra.withdraw');
        Route::post('/withdraw/{id}/cancel', [WithDrawController::class, 'cancel'])->name('mitra.withdraw.cancel');
        
    });

    // Member routes (commented out - uncomment if needed)
    // Route::middleware(['role:member'])->group(function () {
    //     Route::get('/dashboard', function () {
    //         return Inertia::render('User/Dashboard');
    //     })->name('member.dashboard');
    // });

    // Profile management
    Route::controller(ProfileController::class)->group(function () {
        Route::get('/profile', 'edit')->name('profile.edit');
        Route::patch('/profile', 'update')->name('profile.update');
        Route::delete('/profile', 'destroy')->name('profile.destroy');
    });

    // Chat functionality
    Route::controller(ChatController::class)->prefix('chat')->name('chat.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('/{user:uuid}', 'show')->name('show');
        Route::post('/{user:uuid}', 'chat')->name('store');
        Route::delete('/delete/{chat}', 'destroy')->name('destroy');
    });
});

require __DIR__.'/auth.php';