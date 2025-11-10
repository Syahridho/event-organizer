<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Leave;
use App\Models\Event;
use App\Models\Building;
use App\Models\Service;
use App\Models\Testimonial;
use App\Models\ItemPhoto;
use Illuminate\Http\Request;
use App\Models\RentProperty;
use App\Models\TransactionItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Helpers\TaxHelper;

class HomeController extends Controller
{
    public function index()
    {
        $events = Event::where('status', 'active')
            ->inRandomOrder()
            ->limit(10)
            ->get();

        $services = Service::where('status', 'active')
            ->inRandomOrder()
            ->limit(10)
            ->get();

        $buildings = Building::where('status', 'active')
            ->inRandomOrder()
            ->limit(10)
            ->get();

        $propertys = RentProperty::where('status', 'active')
            ->inRandomOrder()
            ->limit(10)
            ->get();

        $testimonials = Testimonial::orderBy('created_at', 'desc')->get();


        return  Inertia::render('Welcome', [
            'events' => $events,
            'services' => $services,
            'buildings' => $buildings,
            'propertys' => $propertys,
            'testimonials' => $testimonials,
        ]);
    }

    public function home()
    {
        $events = Event::where('status', 'active')
            ->inRandomOrder()
            ->latest()
            ->get();

        $services = Service::where('status', 'active')
            ->inRandomOrder()
            ->latest()
            ->get();

        $buildings = Building::where('status', 'active')
            ->inRandomOrder()
            ->latest()
            ->get();
            
        $propertys = RentProperty::where('status', 'active')
            ->inRandomOrder()
            ->latest()
            ->get();

        return Inertia::render('Home/Index', [
            'events' => $events,
            'services' => $services,
            'buildings' => $buildings,
            'propertys' => $propertys,

        ]);
    }

    public function ticket()
    {
        $events = Event::where('status', 'Confirmed')
            ->inRandomOrder()
            ->latest()
            ->paginate(10); 


        return Inertia::render('Home/Ticket', [
            'events' => $events
        ]);
    }

    public function showEvent($id)
    {
        $event = Event::with(['user', 'speakers'])->findOrFail($id);
    
        $tickets = DB::table('tickets')
            ->where('tickets.event_id', $id)
            ->select(
                'tickets.*',
                
                DB::raw('(
                    SELECT COALESCE(SUM(ti.qty), 0)
                    FROM transaction_items as ti
                    JOIN transactions as t ON t.id = ti.transaction_id
                    WHERE ti.item_id = tickets.id
                    AND ti.item_type = \'ticket\'
                    -- Hanya hitung yang statusnya SETTLEMENT
                    AND t.status IN (\'settlement\')
                ) as sold_count')
            )
            ->get();

        // Get tax info for display
        $taxInfo = TaxHelper::getTaxInfo();

        // Process tickets with tax calculation
        $processedTickets = [];
        $ticketsByName = [];
        $totalRemaining = 0;
        
        foreach ($tickets as $ticket) {
            $remaining = max(0, $ticket->quota - $ticket->sold_count);
            $isSoldOut = $remaining <= 0;
            
            // Calculate tax-inclusive price for paid tickets
            $finalPrice = $ticket->price > 0 ? TaxHelper::calculateFinalPrice($ticket->price) : 0;
            $taxAmount = $ticket->price > 0 ? round($finalPrice - $ticket->price, 2) : 0;
            
            $ticketData = [
                'id' => $ticket->id,
                'name' => $ticket->name,
                'price' => $ticket->price,
                'final_price' => $finalPrice, // Tax-inclusive price
                'tax_amount' => $taxAmount,
                'quota' => $ticket->quota,
                'sold_count' => (int) $ticket->sold_count,
                'remaining' => $remaining,
                'is_sold_out' => $isSoldOut,
                'quantity' => $ticket->quota,
            ];
            
            $processedTickets[] = $ticketData;
            $ticketsByName[$ticket->name] = $ticketData;
            $totalRemaining += $remaining;
        }

        $event->setRelation('tickets', collect($processedTickets));
        
        $userId = auth()->id();
        $alreadyRegistered = false;
        $freeTicketId = $tickets->where('name', 'Free')->pluck('id')->first();

        if ($userId) {
            $alreadyRegistered = DB::table('transactions')
                ->join('transaction_items', 'transactions.id', '=', 'transaction_items.transaction_id')
                ->where('transactions.user_id', $userId)
                ->where('transaction_items.item_type', 'ticket')
                ->when($freeTicketId, function ($query, $freeTicketId) {
                    return $query->where('transaction_items.item_id', $freeTicketId);
                })
                ->whereIn('transactions.status', ['settlement'])
                ->exists();
        }

        return Inertia::render('Home/DetailEvent', [
            'id' => $id,
            'event' => $event,
            'ticketsByName' => $ticketsByName,
            'alreadyRegistered' => $alreadyRegistered,
            'totalRemainingTickets' => $totalRemaining,
            'tax_info' => $taxInfo,
        ]);
    }

    public function showService($id)
    {
        $transaction = TransactionItem::where('item_type', 'service')
            ->where('item_id', $id)
            ->whereHas('transaction', function ($query) {
                $query->where('status', '=', 'settlement');
            })
            ->with('transaction.user')
            ->get();
            
        $service = Service::findOrFail($id);
        $userId = auth()->id();

        $photos = ItemPhoto::where('item_id', $id)
        ->where('item_type', 'App\Models\Service')
        ->get();
    
        $leaves = Leave::where('item_id', $id)
            ->where('item_type', 'service')
            ->where(function($query) {
                $query->where(function($q) {
                
                    $q->whereNotNull('date')
                    ->whereDate('date', '>=', now());
                })
                ->orWhere(function($q) {
                
                    $q->whereNotNull('day_of_week')
                    ->whereNull('date');
                });
            })
            ->orderBy('date', 'asc')
            ->orderBy('day_of_week', 'asc')
            ->get();


        // Calculate tax-inclusive price
        $finalPrice = TaxHelper::calculateFinalPrice($service->price);
        
        // Get tax info for display
        $taxInfo = TaxHelper::getTaxInfo();

        // Prepare service data with tax information
        $serviceData = [
            'id' => $service->id,
            'name' => $service->name,
            'price' => $service->price,
            'final_price' => $finalPrice, // Tax-inclusive price
            'tax_amount' => round($finalPrice - $service->price, 2),
            'description' => $service->description,
            'location' => $service->location,
            'thumbnail' => $service->thumbnail,
            'status' => $service->status,
            'user_id' => $service->user_id,
            'created_at' => $service->created_at,
            'updated_at' => $service->updated_at,
        ];

    
        return Inertia::render('Home/DetailService', [
            'id' => $id,
            'service' => $serviceData,
            'user' => Auth::user(),
            'transaction' => $transaction,
            'leaves' => $leaves,
            'photos' => $photos,
            'tax_info' => $taxInfo,
        ]);
    }

    public function showBuilding($id)
    {
        $transaction = TransactionItem::where('item_type', 'building')
            ->where('item_id', $id)
            ->whereHas('transaction', function ($query) {
                $query->where('status', '=', 'settlement');
            })
            ->with('transaction.user')
            ->get();

        $building = Building::findOrFail($id);

        $photos = ItemPhoto::where('item_id', $id)
        ->where('item_type', 'App\Models\Building')
        ->get();

        $userId = auth()->id();

        $leaves = Leave::where('item_id', $id)
        ->where('item_type', 'building')
        ->where(function($query) {
            $query->where(function($q) {
                // Cuti tanggal spesifik yang masih akan datang
                $q->whereNotNull('date')
                  ->whereDate('date', '>=', now());
            })
            ->orWhere(function($q) {
                // Cuti mingguan (day_of_week tidak null)
                $q->whereNotNull('day_of_week')
                  ->whereNull('date');
            });
        })
        ->orderBy('date', 'asc')
        ->orderBy('day_of_week', 'asc')
        ->get();

        // Calculate tax-inclusive price
        $finalPrice = TaxHelper::calculateFinalPrice($building->price);
        
        // Get tax info for display
        $taxInfo = TaxHelper::getTaxInfo();

        // Prepare building data with tax information
        $buildingData = [
            'id' => $building->id,
            'name' => $building->name,
            'price' => $building->price,
            'final_price' => $finalPrice, // Tax-inclusive price
            'tax_amount' => round($finalPrice - $building->price, 2),
            'description' => $building->description,
            'location' => $building->location,
            'thumbnail' => $building->thumbnail,
            'capacity' => $building->capacity,
            'pin' => $building->pin,
            'status' => $building->status,
            'user_id' => $building->user_id,
            'created_at' => $building->created_at,
            'updated_at' => $building->updated_at,
        ];

        return Inertia::render('Home/DetailBuilding', [
            'id' => $id,
            'building' => $buildingData,
            'user' => Auth::user(),
            'transaction' => $transaction,
            'leaves' => $leaves,
            'photos' => $photos,
            'tax_info' => $taxInfo,
        ]);
    }

    public function showProperty($id)
    {
        $transaction = TransactionItem::where('item_type', 'rent_property')
            ->where('item_id', $id)
            ->whereHas('transaction', function ($query) {
                $query->where('status', '=', 'settlement');
            })
            ->with('transaction.user')
            ->get();

        $property = RentProperty::findOrFail($id);

        $photos = ItemPhoto::where('item_id', $id)
        ->where('item_type', 'App\Models\RentProperty')
        ->get();

        $userId = auth()->id();

        $leaves = Leave::where('item_id', $id)
        ->where('item_type', 'rent_property')
        ->where(function($query) {
            $query->where(function($q) {
                // Cuti tanggal spesifik yang masih akan datang
                $q->whereNotNull('date')
                  ->whereDate('date', '>=', now());
            })
            ->orWhere(function($q) {
                // Cuti mingguan (day_of_week tidak null)
                $q->whereNotNull('day_of_week')
                  ->whereNull('date');
            });
        })
        ->orderBy('date', 'asc')
        ->orderBy('day_of_week', 'asc')
        ->get();

        // Calculate tax-inclusive price
        $finalPrice = TaxHelper::calculateFinalPrice($property->price);
        
        // Get tax info for display
        $taxInfo = TaxHelper::getTaxInfo();

        // Prepare property data with tax information
        $propertyData = [
            'id' => $property->id,
            'name' => $property->name,
            'price' => $property->price,
            'final_price' => $finalPrice, // Tax-inclusive price
            'tax_amount' => round($finalPrice - $property->price, 2),
            'description' => $property->description,
            'location' => $property->location,
            'thumbnail' => $property->thumbnail,
            'area' => $property->area,
            'bedrooms' => $property->bedrooms,
            'bathrooms' => $property->bathrooms,
            'facilities' => $property->facilities,
            'pin' => $property->pin,
            'status' => $property->status,
            'user_id' => $property->user_id,
            'created_at' => $property->created_at,
            'updated_at' => $property->updated_at,
        ];



        return Inertia::render('Home/DetailProperty', [
            'id' => $id,
            'property' => $propertyData,
            'user' => Auth::user(),
            'transaction' => $transaction,
            'leaves' => $leaves,
            'photos' => $photos,
            'tax_info' => $taxInfo,
        ]);
    }

    public function terms()
    {
        return Inertia::render('Terms');
    }

    public function search(Request $request)
    {
        $keyword = trim($request->query('keyword', ''));
        $type = $request->query('type');

        if ($keyword === '') {
            return Inertia::render('Search/Index', [
                'products' => [],
                'keyword' => '',
                'type' => $type,
            ]);
        }

        $results = collect();

        if ($type === 'event') {
            $results = Event::when($keyword, fn($q) =>
                $q->where('name', 'like', "%{$keyword}%")
            )->get()->map(fn($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'price' => $item->price ?? null,
                'type' => 'event',
                'thumbnail' => $item->thumbnail ? $item->thumbnail : null,
                'location' => $item->location ?? null,
            ]);
        } elseif ($type === 'building') {
            $results = Building::when($keyword, fn($q) =>
                $q->where('name', 'like', "%{$keyword}%")
            )->get()->map(fn($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'price' => $item->price ?? null,
                'type' => 'building',
                'thumbnail' => $item->thumbnail ? '/thumbnails/'.$item->thumbnail : null,
                'location' => $item->location ?? null,
            ]);
        } elseif ($type === 'service') {
            $results = Service::when($keyword, fn($q) =>
                $q->where('name', 'like', "%{$keyword}%")
            )->get()->map(fn($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'price' => $item->price ?? null,
                'type' => 'service',
                'thumbnail' => $item->thumbnail ? '/thumbnails/'.$item->thumbnail : null,
                'location' => $item->location ?? null,
            ]);
        } elseif ($type === 'property') {
            $results = RentProperty::when($keyword, fn($q) =>
                $q->where('name', 'like', "%{$keyword}%")
            )->get()->map(fn($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'price' => $item->price ?? null,
                'type' => 'property',
                'thumbnail' => $item->thumbnail ? '/thumbnails/'.$item->thumbnail : null,
                'location' => $item->location ?? null,
            ]);
        } elseif ($type === 'mitra') {
            $results = \App\Models\User::query()
                ->where('role', 'mitra')
                ->where(function ($q) use ($keyword) {
                    $q->where('name', 'like', "%{$keyword}%")
                      ->orWhere('username', 'like', "%{$keyword}%");
                })
                ->when(auth()->check(), function ($q) {
                    $q->where('id', '<>', auth()->id());
                })
                ->get()
                ->map(fn($u) => [
                    'id' => $u->id,
                    'uuid' => $u->uuid,
                    'name' => $u->name,
                    'type' => 'mitra',
                    'thumbnail' => $u->profile_photo ?? null,
                ]);
        } else {
            // Semua kategori (event, building, service, property, user, mitra)
            $results = collect()
                ->merge(Event::where('name', 'like', "%{$keyword}%")->get()->map(fn($i) => [
                    'id' => $i->id,
                    'name' => $i->name,
                    'price' => $i->price ?? null,
                    'type' => 'event',
                    'thumbnail' => $i->thumbnail ? $i->thumbnail : null,
                    'location' => $i->location ?? null,
                ]))
                ->merge(Building::where('name', 'like', "%{$keyword}%")->get()->map(fn($i) => [
                    'id' => $i->id,
                    'name' => $i->name,
                    'price' => $i->price ?? null,
                    'type' => 'building',
                    'thumbnail' => $i->thumbnail ? '/thumbnails/'.$i->thumbnail : null,
                    'location' => $i->location ?? null,
                ]))
                ->merge(Service::where('name', 'like', "%{$keyword}%")->get()->map(fn($i) => [
                    'id' => $i->id,
                    'name' => $i->name,
                    'price' => $i->price ?? null,
                    'type' => 'service',
                    'thumbnail' => $i->thumbnail ? '/thumbnails/'.$i->thumbnail : null,
                    'location' => $i->location ?? null,
                ]))
                ->merge(RentProperty::where('name', 'like', "%{$keyword}%")->get()->map(fn($i) => [
                    'id' => $i->id,
                    'name' => $i->name,
                    'price' => $i->price ?? null,
                    'type' => 'property',
                    'thumbnail' => $i->thumbnail ? '/thumbnails/'.$i->thumbnail : null,
                    'location' => $i->location ?? null,
                ]))
                ->merge(\App\Models\User::query()
                    ->where('role', 'mitra')
                    ->where(function ($q) use ($keyword) {
                        $q->where('name', 'like', "%{$keyword}%")
                          ->orWhere('username', 'like', "%{$keyword}%");
                    })
                    ->when(auth()->check(), function ($q) {
                        $q->where('id', '<>', auth()->id());
                    })
                    ->get()
                    ->map(fn($u) => [
                        'id' => $u->id,
                        'uuid' => $u->uuid,
                        'name' => $u->name,
                        'type' => 'mitra',
                        'thumbnail' => $u->profile_photo ?? null,
                    ])
                );
        }

        return Inertia::render('Search/Index', [
            'products' => $results,
            'keyword' => $keyword,
            'type' => $type,
        ]);
    }
}
