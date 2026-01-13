<?php

namespace App\Http\Controllers;

use App\Http\Requests\EventRequest;
use App\Http\Requests\EventUpdateRequest;
use App\Models\Event;
use App\Models\Speaker;
use App\Models\Ticket;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Str;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Helpers\TaxHelper;

class EventController extends Controller
{
    public function create()
    {
        return Inertia::render('Mitra/Events/Create');
    }
 
    public function store(EventRequest $request)
    {
        try {
            $data = $request->validated();

            if (!isset($data['tickets']) || empty($data['tickets'])) {
                $data['tickets'] = [
                    [
                        'name' => 'Free',
                        'quota' => 99999999,
                        'price' => 0,
                    ]
                ];
            }

            $data['event_date_start'] = Carbon::parse($data['event_date_start'])->format('Y-m-d H:i:s');

            $data['pin'] = is_array($data['pin']) ? implode(',', $data['pin']) : null;

            $data['event_date_end'] = Arr::get($data, 'event_date_end')
                ? Carbon::parse($data['event_date_end'])->format('Y-m-d H:i:s')
                : $data['event_date_start'];

            $data['ticket_date_start'] = Arr::get($data, 'ticket_date_start')
                ? Carbon::parse($data['ticket_date_start'])->format('Y-m-d H:i:s')
                : Carbon::now()->format('Y-m-d H:i:s');

            $data['ticket_date_end'] = Arr::get($data, 'ticket_date_end')
                ? Carbon::parse($data['ticket_date_end'])->format('Y-m-d H:i:s')
                : $data['event_date_start'];

            $data['status'] = 'active';
            $data['user_id'] =  Auth::user()->id;

            $thumbnail = $data['thumbnail'] ?? null;

            if (!is_string($thumbnail)) {
                $path = $thumbnail->store('thumbnails', 'public');
                $data['thumbnail'] = str_replace('thumbnails/', '', $path);
            }

            $event = Event::create($data);

            if (!empty($data['speakers']) && is_array($data['speakers'])) {
                foreach ($data['speakers'] as $index => $speakerData) {
                    $photoSpeaker = '';
                    if ($request->hasFile("speakers.$index.photo")) {
                        $photoFile = $request->file("speakers")[$index]['photo'];
                        $path = $photoFile->store('speakers', 'public');
                        $photoSpeaker = str_replace('speakers/', '', $path);
                    }

                    Speaker::create([
                        'event_id' => $event->id,
                        'name' => $speakerData['name'],
                        'photo' => $photoSpeaker,
                        'description' => $speakerData['description'],
                    ]);
                }
            }

            if (!empty($data['tickets']) && is_array($data['tickets'])) {
                foreach ($data['tickets'] as $ticketData) {
                    $ticketData['price'] = (int) preg_replace('/\D/', '', $ticketData['price']);
                    Ticket::create([
                        'event_id' => $event->id,
                        'name' => $ticketData['name'],
                        'price' => $ticketData['price'],
                        'quota' => $ticketData['quota'],
                    ]);
                }
            }

            return redirect()->route('events.index')->with('success', 'Event berhasil dibuat');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal membuat event: ' . $e->getMessage());
        }
    }

    public function index()
    {
        $events = Event::with('speakers', 'tickets')
            ->withCount(['transactionItems as settled_transactions_count' => function ($query) {
                $query->whereHas('transaction', function ($subQuery) {
                    $subQuery->where('status', 'settlement');
                });
            }])
            ->where('user_id', Auth::id())
            ->latest()
            ->get()
            ->map(function ($event) {
                $now = Carbon::now();
                $eventStart = Carbon::parse($event->event_date_start);
                $eventEnd = Carbon::parse($event->event_date_end);
                
                // Determine event status based on dates
                if ($now->lt($eventStart)) {
                    $event->event_status = 'upcoming';
                } elseif ($now->between($eventStart, $eventEnd)) {
                    $event->event_status = 'ongoing';
                } else {
                    $event->event_status = 'completed';
                }
                
                return $event;
            });

        return Inertia::render('Mitra/Events/Index', [
            'events' => $events,
        ]);
    }

    /**
     * Helper function to check if an event has settled transactions.
     */
    private function eventHasSettledTransactions(Event $event)
    {
        return $event->transactionItems()
            ->whereHas('transaction', function ($query) {
                $query->where('status', 'settlement');
            })
            ->exists();
    }

    public function update(EventUpdateRequest $request, Event $event)
    {
        try {
            // Cek otorisasi
            if ($event->user_id !== Auth::id()) {
                abort(403);
            }

            $message = 'Acara ini tidak dapat diubah karena sudah memiliki tiket terjual. Harap hubungi administrator jika Anda perlu melakukan perubahan.';
            if ($this->eventHasSettledTransactions($event)) {
                abort(403, $message);
            }
            // === AKHIR VALIDASI ===
            $data = $request->validated();
    
            $data['event_date_start'] = Carbon::parse($data['event_date_start'])->format('Y-m-d H:i:s');
            $data['pin'] = is_array($data['pin']) ? implode(',', $data['pin']) : null;
            
            $data['event_date_end'] = Arr::get($data, 'event_date_end')
                ? Carbon::parse($data['event_date_end'])->format('Y-m-d H:i:s')
                : $data['event_date_start'];
    
            $data['ticket_date_start'] = Arr::get($data, 'ticket_date_start')
                ? Carbon::parse($data['ticket_date_start'])->format('Y-m-d H:i:s')
                : Carbon::now()->format('Y-m-d H:i:s');
    
            $data['ticket_date_end'] = Arr::get($data, 'ticket_date_end')
                ? Carbon::parse($data['ticket_date_end'])->format('Y-m-d H:i:s')
                : $data['event_date_start'];
    
            $data['speakers'] = $data['speakers'] ?? [];
            $data['tickets'] = $data['tickets'] ?? [];

            // Enforce default free ticket when no ticket data provided
            if (!isset($data['tickets']) || empty($data['tickets'])) {
                $data['tickets'] = [
                    [
                        'name' => 'Free',
                        'quota' => 99999999,
                        'price' => 0,
                    ]
                ];
            }
    
            
            $thumbnail = $data['thumbnail'] ?? null;

            if ($thumbnail) {
                // Cek apakah thumbnail yang dikirim sama dengan thumbnail yang sudah ada di database
                if (is_string($thumbnail) && $thumbnail === $event->thumbnail) {
                    // Tidak ada perubahan - jangan update thumbnail
                    unset($data['thumbnail']);
                } 
                // Cek apakah ini adalah file upload baru (bukan string, tapi object file)
                elseif (!is_string($thumbnail)) {
                    // Hapus thumbnail lama jika itu adalah file upload user (bukan default image)
                    if ($event->thumbnail && !str_contains($event->thumbnail, 'default-event-images')) {
                        Storage::disk('public')->delete('thumbnails/' . $event->thumbnail);
                    }
                    // Simpan file baru ke storage
                    $path = $thumbnail->store('thumbnails', 'public');
                    // Simpan hanya nama file (tanpa path 'thumbnails/')
                    $data['thumbnail'] = basename($path);
                } 
                // User mengganti ke gambar yang berbeda (berupa string path)
                else {
                    // Hapus thumbnail lama jika itu adalah file upload user (bukan default image)
                    if ($event->thumbnail && !str_contains($event->thumbnail, 'default-event-images')) {
                        Storage::disk('public')->delete('thumbnails/' . $event->thumbnail);
                    }
                    
                    // Bersihkan path - simpan hanya path relatif dari folder 'thumbnails/'
                    $data['thumbnail'] = str_replace(['/storage/thumbnails/', 'thumbnails/'], '', $thumbnail);
                }
            } else {
                // Tidak ada thumbnail yang dikirim - jangan update field thumbnail
                unset($data['thumbnail']);
            }

            // Update data event ke database
            $event->update($data);
    
            // Process speakers
            if (isset($data['speakers']) && is_array($data['speakers'])) {
                $submittedSpeakerIds = [];
    
                foreach ($data['speakers'] as $index => $speakerData) {
                    $speakerId = $speakerData['id'] ?? null;
                    $photoFile = $request->hasFile("speakers.$index.photo")
                        ? $request->file("speakers.$index.photo")
                        : ($speakerData['photo'] ?? null);
    
                    $photoPath = null;
                    if ($speakerId) {
                        if ($photoFile && !is_string($photoFile)) {
                            $path = $photoFile->store('speakers', 'public');
                            $photoPath = str_replace('speakers/', '', $path);
                        } elseif (is_string($photoFile)) {
                            $photoPath = $speakerData['photo'] ?? null;
                        }
                        
                        $speaker = Speaker::find($speakerId);
                        $updateData = [
                            'name' => $speakerData['name'],
                            'description' => $speakerData['description'],
                        ];
    
                        if (!is_string($photoFile) && $photoFile) {
                            if ($speaker->photo) {
                                Storage::disk('public')->delete('speakers/' . $speaker->photo);
                            }
                            $updateData['photo'] = $photoPath;
                        }
    
                        $speaker->update($updateData);
                        $submittedSpeakerIds[] = $speaker->id;
                    } else {
                        $path = $photoFile->store('speakers', 'public');
                        $photoPath = str_replace('speakers/', '', $path);
    
                        $newSpeaker = Speaker::create([
                            'event_id' => $event->id,
                            'name' => $speakerData['name'],
                            'photo' => $photoPath,
                            'description' => $speakerData['description'] ?? '',
                        ]);
    
                        $submittedSpeakerIds[] = $newSpeaker->id;
                    }
                }
    
                $speakersToDelete = Speaker::where('event_id', $event->id)
                    ->whereNotIn('id', $submittedSpeakerIds)
                    ->get();
    
                foreach ($speakersToDelete as $speaker) {
                    if ($speaker->photo) {
                        Storage::disk('public')->delete('speakers/' . $speaker->photo);
                    }
                    $speaker->delete();
                }
            }
    
            // Process tickets
            if (is_array($data['tickets'])) {
                $submittedTicketIds = [];
                $warnings = [];
    
                if (!empty($data['tickets'])) {
                    foreach ($data['tickets'] as $ticketData) {
                        $ticketId = $ticketData['id'] ?? null;
                        $ticketData['price'] = (int) preg_replace('/\D/', '', $ticketData['price']);
    
                        if ($ticketId) {
                            // UPDATE existing ticket
                            $ticket = Ticket::where('event_id', $event->id)->find($ticketId);
                            
                            if ($ticket) {
                                // Hitung sold count dan buyer count
                                $soldCount = DB::table('transaction_items')
                                    ->join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
                                    ->where('transaction_items.item_id', $ticket->id)
                                    ->where('transaction_items.item_type', 'ticket')
                                    ->whereIn('transactions.status', ['settlement', 'pending'])
                                    ->sum('transaction_items.qty');
    
                                $buyerCount = DB::table('transaction_items')
                                    ->join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
                                    ->where('transaction_items.item_id', $ticket->id)
                                    ->where('transaction_items.item_type', 'ticket')
                                    ->whereIn('transactions.status', ['settlement', 'pending'])
                                    ->distinct('transactions.user_id')
                                    ->count('transactions.user_id');
    
                                // WARNING: Cek apakah ada perubahan harga
                                if ($ticket->price != $ticketData['price'] && $soldCount > 0) {
                                    $warnings[] = "Tiket '{$ticket->name}': Harga diubah dari Rp " . number_format($ticket->price, 0, ',', '.') . 
                                                 " menjadi Rp " . number_format($ticketData['price'], 0, ',', '.') . 
                                                 ". Sudah ada {$buyerCount} pembeli dengan {$soldCount} tiket terjual.";
                                }
    
                                // WARNING: Cek apakah quota dikurangi
                                if ($ticket->quota > $ticketData['quota'] && $soldCount > 0) {
                                    $warnings[] = "Tiket '{$ticket->name}': Quota dikurangi dari {$ticket->quota} menjadi {$ticketData['quota']}. " .
                                                 "Sudah ada {$buyerCount} pembeli dengan {$soldCount} tiket terjual.";
                                }
    
                                // Validasi quota minimal
                                if ($ticketData['quota'] < $soldCount) {
                                    return redirect()->back()
                                        ->withInput()
                                        ->withErrors([
                                            'tickets' => "Tiket '{$ticket->name}' tidak bisa diupdate. Quota baru ({$ticketData['quota']}) lebih kecil dari yang sudah terjual ({$soldCount})."
                                        ]);
                                }
    
                                $ticket->update([
                                    'name' => $ticketData['name'],
                                    'price' => $ticketData['price'],
                                    'quota' => $ticketData['quota'],
                                ]);
                                
                                $submittedTicketIds[] = $ticket->id;
                            }
                        } else {
                            // CREATE new ticket
                            $newTicket = Ticket::create([
                                'event_id' => $event->id,
                                'name' => $ticketData['name'],
                                'price' => $ticketData['price'],
                                'quota' => $ticketData['quota'],
                            ]);
                            $submittedTicketIds[] = $newTicket->id;
                        }
                    }
                }
    
                // Hapus ticket yang tidak di-submit (dengan validasi)
                $ticketsToDelete = Ticket::where('event_id', $event->id)
                    ->whereNotIn('id', $submittedTicketIds)
                    ->get();
    
                foreach ($ticketsToDelete as $ticket) {
                    // Cek transaksi
                    $hasTransactions = DB::table('transaction_items')
                        ->where('item_id', $ticket->id)
                        ->where('item_type', 'ticket')
                        ->exists();
    
                    // Cek cart
                    $hasInCart = DB::table('carts')
                        ->where('item_id', $ticket->id)
                        ->where('item_type', 'App\\Models\\Ticket')
                        ->exists();
    
                    if ($hasTransactions || $hasInCart) {
                        return redirect()->back()
                            ->withInput()
                            ->withErrors([
                                'tickets' => "Tiket '{$ticket->name}' tidak bisa dihapus karena masih digunakan."
                            ]);
                    }
                }
    
                $ticketsToDelete->each->delete();
    
                // Redirect dengan warnings jika ada perubahan
                if (!empty($warnings)) {
                    return redirect()->route('events.index')
                        ->with('success', 'Event berhasil diperbarui')
                        ->with('warnings', $warnings);
                }
            }
    
            return redirect()->route('events.index')->with('success', 'Event berhasil diperbarui');
        } catch (\Exception $e) {
            \Log::error('Update event error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return redirect()->back()->withInput()->withErrors(['error' => 'Failed to update event: ' . $e->getMessage()]);
        }
    }


    public function destroy(Event $event)
    {
        try {
            // === VALIDASI BARU ===
            // Cek otorisasi
            if ($event->user_id !== Auth::id()) {
                abort(403);
            }

            $message = 'Acara ini tidak dapat dihapus karena sudah memiliki tiket terjual. Harap hubungi administrator jika Anda perlu melakukan perubahan.';
            if ($this->eventHasSettledTransactions($event)) {
                abort(403, $message);
            }
            // === AKHIR VALIDASI ===
            // Only delete user-uploaded thumbnails, not default images
            if ($event->thumbnail &&
                !str_contains($event->thumbnail, 'default-event-images') &&
                Storage::disk('public')->exists('thumbnails/' . $event->thumbnail)) {
                Storage::disk('public')->delete('thumbnails/' . $event->thumbnail);
            }

            foreach ($event->speakers as $speaker) {
                if ($speaker->photo && Storage::disk('public')->exists('speakers/' . $speaker->photo)) {
                    Storage::disk('public')->delete('speakers/' . $speaker->photo);
                }
                $speaker->delete();
            }

            foreach ($event->tickets as $ticket) {
                $ticket->delete();
            }

            $event->delete();

            return Redirect::back()->with('success', 'Event berhasil dihapus.');
        } catch (\Exception $e) {
            return Redirect::back()->withErrors(['error' => 'Gagal menghapus event: ' . $e->getMessage()]);
        }
    }

    public function edit($id)
    {
        $event = Event::with(['speakers', 'tickets'])->findOrFail($id);

        return Inertia::render('Mitra/Events/Update', [
            'event' => $event,
            'id' => $id
        ]);
    }

    public function eventShow($id)
    {
        $event = Event::with(['speakers', 'tickets'])->findOrFail($id);

        return Inertia::render('dashboard/mitra/event/detail/index', [
            'id' => $id,
            'event' => $event
        ]);
    }

    public function show($id)
    {
        $event = Event::with(['tickets'])->findOrFail($id);

        // Inject a virtual "Default Free Ticket" when no tickets exist
        if ($event->tickets->isEmpty()) {
            $virtualTicket = new Ticket([
                'id' => -1, // Virtual identifier
                'event_id' => $event->id,
                'name' => 'Free Default',
                'price' => 0,
                'quota' => 9999999,
            ]);
            // Additional virtual-only attributes
            $virtualTicket->setAttribute('is_sold_out', false);
            // Mark as not persisted
            $virtualTicket->exists = false;

            // Replace the relationship collection with our virtual ticket
            $event->setRelation('tickets', collect([$virtualTicket]));
        }

        // Calculate tax-inclusive prices for all tickets (real or virtual)
        $ticketsWithTax = $event->tickets->map(function ($ticket) {
            $finalPrice = TaxHelper::calculateFinalPrice($ticket->price);

            return [
                'id' => $ticket->id,
                'name' => $ticket->name,
                'price' => $ticket->price,
                'final_price' => $finalPrice, // Tax-inclusive price
                'quota' => $ticket->quota,
                'is_sold_out' => (bool) data_get($ticket, 'is_sold_out', false),
                'tax_amount' => round($finalPrice - $ticket->price, 2),
            ];
        });

        // Get tax info for display
        $taxInfo = TaxHelper::getTaxInfo();

        return Inertia::render('Mitra/Events/show', [
            'id' => $id,
            'event' => $event,
            'tickets' => $ticketsWithTax,
            'tax_info' => $taxInfo,
        ]);
    }

    public function eventFree(Request $request)
    {
        try {
            $request->validate([
                'items' => 'required|array',
                'items.*.id' => 'required|integer',
                'items.*.type' => 'required|string|in:ticket,service,building,rent_property',
                'items.*.quantity' => 'required|integer|max:999',
                'items.*.note' => 'nullable|string|max:255',
                'amount' => 'required|numeric|max:0',
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255'
            ]);

            $validatedItems = $request->input('items');

            if (!$validatedItems || !is_array($validatedItems)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Item transaksi tidak valid.',
                ], 400);
            }

            $itemId = $validatedItems[0]['id'];


            $itemType = $validatedItems[0]['type'];
            $itemNote = $validatedItems[0]['note'] ?? null;
            $userId = Auth::id();

            // ✅ CEK APAKAH USER SUDAH PERNAH DAFTAR TRANSAKSI GRATIS
            $alreadyRegistered = DB::table('transactions')
                ->join('transaction_items', 'transactions.id', '=', 'transaction_items.transaction_id')
                ->where('transactions.user_id', $userId)
                ->where('transaction_items.item_type', $itemType)
                ->where('transaction_items.item_id', $itemId)
                ->where('transactions.status', '!=', 'Pending')
                ->where('transactions.redirect_url', 'free')
                ->exists();

            if ($alreadyRegistered) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kamu sudah terdaftar pada transaksi gratis ini.',
                ], 400);
            }

            // Lanjut proses transaksi gratis
            $orderId = 'ORD-' . now()->format('YmdHis') . '-' . Str::random(6);

            $transaction = Transaction::create([
                'user_id' => $userId,
                'order_id' => $orderId,
                'redirect_url' => 'free',
                'status' => 'settlement',
                'token' => 'free',
                'total' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $transactionItems = [
                'transaction_id' => $transaction->id,
                'item_id' => $itemId,
                'item_type' => $itemType,
                'type' => "Free",
                'qty' => 1,
                'price' => 0,
                'note' => $itemNote,
                'created_at' => now(),
                'updated_at' => now(),
            ];

            TransactionItem::insert($transactionItems);

            return response()->json([
                'success' => true,
                'token' => 'free',
                'order_id' => $orderId,
                'redirect_url' => 'free',
            ]);

        } catch (\Throwable $e) {
            Log::error($e);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

}
