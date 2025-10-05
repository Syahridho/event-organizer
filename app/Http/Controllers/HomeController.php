<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Leave;
use App\Models\Event;
use App\Models\Building;
use App\Models\Service;
use App\Models\ItemPhoto;
use Illuminate\Http\Request; 
use App\Models\RentProperties;
use App\Models\TransactionItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class HomeController extends Controller
{
    public function index()
    {
        $events = Event::where('status', 'active')
            ->get();

        $services = Service::where('status', 'active')
            ->get();

        $buildings = Building::where('status', 'active')
            ->get();

        $propertys = RentProperties::where('status', 'active')
            ->get();

        return  Inertia::render('Welcome', [
            'events' => $events,
            'services' => $services,
            'buildings' => $buildings,
            'propertys' => $propertys,
        ]);
    }

    public function home()
    {
        $events = Event::where('status', 'active')
            ->latest()
            ->get();

        $services = Service::where('status', 'active')
            ->latest()
            ->get();

        $buildings = Building::where('status', 'active')
            ->latest()
            ->get();
            
        $propertys = RentProperties::where('status', 'active')
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
            ->latest()
            ->paginate(10); 


        return Inertia::render('Home/Ticket', [
            'events' => $events
        ]);
    }

    public function showEvent($id)
{
    // Load event dengan relasi
    $event = Event::with(['user', 'speakers'])->findOrFail($id);
    
    // Query manual untuk mendapatkan sold_count yang akurat
    $tickets = DB::table('tickets')
        ->leftJoin('transaction_items', function($join) {
            $join->on('tickets.id', '=', 'transaction_items.item_id')
                 ->where('transaction_items.item_type', '=', 'ticket');
        })
        ->leftJoin('transactions', function($join) {
            $join->on('transaction_items.transaction_id', '=', 'transactions.id')
                 ->whereIn('transactions.status', ['settlement']);
        })
        ->where('tickets.event_id', $id)
        ->select(
            'tickets.*',
            DB::raw('COALESCE(SUM(transaction_items.qty), 0) as sold_count')
        )
        ->groupBy(
            'tickets.id',
            'tickets.event_id', 
            'tickets.name', 
            'tickets.price', 
            'tickets.quota',
            'tickets.created_at',
            'tickets.updated_at'
        )
        ->get();
    
    // Attach tickets ke event sebagai collection
    $event->setRelation('tickets', $tickets);
    
    // Buat array asosiatif berdasarkan nama tiket
    $ticketsByName = [];
    $totalRemaining = 0;
    
    foreach ($tickets as $ticket) {
        $remaining = max(0, $ticket->quota - $ticket->sold_count);
        $isSoldOut = $remaining <= 0;
        
        $ticketsByName[$ticket->name] = [
            'id' => $ticket->id,
            'name' => $ticket->name,
            'price' => $ticket->price,
            'quota' => $ticket->quota,
            'sold_count' => (int) $ticket->sold_count,
            'remaining' => $remaining,
            'is_sold_out' => $isSoldOut,
        ];
        
        $totalRemaining += $remaining;
        
        // Tetap set property untuk kompatibilitas dengan code existing
        $ticket->quantity = $ticket->quota;
        $ticket->remaining = $remaining;
        $ticket->is_sold_out = $isSoldOut;
    }
    
    $userId = auth()->id();
    $alreadyRegistered = false;

    if ($userId) {
        $alreadyRegistered = DB::table('transactions')
            ->join('transaction_items', 'transactions.id', '=', 'transaction_items.transaction_id')
            ->where('transactions.user_id', $userId)
            ->where('transaction_items.item_type', 'ticket') 
            ->whereIn('transaction_items.item_id', $tickets->pluck('id'))
            ->whereIn('transactions.status', ['settlement'])
            ->exists();
    }

    // dd($ticketsByName);


    return Inertia::render('Home/DetailEvent', [
        'id' => $id,
        'event' => $event,
        'ticketsByName' => $ticketsByName,
        'alreadyRegistered' => $alreadyRegistered,
        'totalRemainingTickets' => $totalRemaining,
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
    
        $leaves = Leave::where('user_id', $userId)
        ->where('item_id', $id)
        ->where('item_type', 'service')
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

    
        return Inertia::render('Home/DetailService', [
            'id' => $id,
            'service' => $service,
            'user' => Auth::user(),
            'transaction' => $transaction,
            'leaves' => $leaves,
            'photos' => $photos,
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

        $leaves = Leave::where('user_id', $userId)
        ->where('item_id', $id)
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

        return Inertia::render('Home/DetailBuilding', [
            'id' => $id,
            'building' => $building,
            'user' => Auth::user(),
            'transaction' => $transaction,
            'leaves' => $leaves,
            'photos' => $photos,
        ]);
    }

    public function showProperty($id)
    {
        $transaction = TransactionItem::where('item_type', 'property')
            ->where('item_id', $id)
            ->whereHas('transaction', function ($query) {
                $query->where('status', '=', 'settlement');
            })
            ->with('transaction.user')
            ->get();

        $property = RentProperties::findOrFail($id);

        $photos = ItemPhoto::where('item_id', $id)
        ->where('item_type', 'App\Models\RentProperties')
        ->get();

        $userId = auth()->id();

        $leaves = Leave::where('user_id', $userId)
        ->where('item_id', $id)
        ->where('item_type', 'rent_properties')
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

        $user = auth();

        return Inertia::render('Home/DetailProperty', [
            'id' => $id,
            'property' => $property,
            'user' => Auth::user(),
            'transaction' => $transaction,
            'leaves' => $leaves,
            'photos' => $photos,
        ]);
    }

    public function search(Request $request)
    {
        $keyword = $request->query('keyword');
        $type = $request->query('type'); // event, building, service, property

        if (empty($keyword)) {
            return Inertia::render('Search/Index', [
                'products' => [],
                'keyword' => '',
                'type' => $type,
            ]);
        }


        $results = [];

        if ($type === 'event') {
            $results = Event::when($keyword, fn($q) => 
                $q->where('name', 'like', "%{$keyword}%")
            )->get()->map(fn($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'price' => $item->price ?? null,
                'type' => 'event',
            ]);
        } elseif ($type === 'building') {
            $results = Building::when($keyword, fn($q) => 
                $q->where('name', 'like', "%{$keyword}%")
            )->get()->map(fn($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'price' => $item->price ?? null,
                'type' => 'building',
            ]);
        } elseif ($type === 'service') {
            $results = Service::when($keyword, fn($q) => 
                $q->where('name', 'like', "%{$keyword}%")
            )->get()->map(fn($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'price' => $item->price ?? null,
                'type' => 'service',
            ]);
        } elseif ($type === 'property') {
            $results = RentProperties::when($keyword, fn($q) => 
                $q->where('name', 'like', "%{$keyword}%")
            )->get()->map(fn($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'price' => $item->price ?? null,
                'type' => 'property',
            ]);
        } else {
            // Kalau user pilih "semua kategori"
            $results = collect()
                ->merge(Event::where('name', 'like', "%{$keyword}%")->get()->map(fn($i) => [
                    'id' => $i->id,
                    'name' => $i->name,
                    'price' => $i->price ?? null,
                    'type' => 'event',
                ]))
                ->merge(Building::where('name', 'like', "%{$keyword}%")->get()->map(fn($i) => [
                    'id' => $i->id,
                    'name' => $i->name,
                    'price' => $i->price ?? null,
                    'type' => 'building',
                ]))
                ->merge(Service::where('name', 'like', "%{$keyword}%")->get()->map(fn($i) => [
                    'id' => $i->id,
                    'name' => $i->name,
                    'price' => $i->price ?? null,
                    'type' => 'service',
                ]))
                ->merge(RentProperties::where('name', 'like', "%{$keyword}%")->get()->map(fn($i) => [
                    'id' => $i->id,
                    'name' => $i->name,
                    'price' => $i->price ?? null,
                    'type' => 'property',
                ]));
        }

        return Inertia::render('Search/Index', [
            'products' => $results,
            'keyword' => $keyword,
            'type' => $type,
        ]);
    }
}
