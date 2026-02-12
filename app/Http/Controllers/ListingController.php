<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Event;
use App\Models\Service;
use App\Models\Building;
use App\Models\RentProperty;
use App\Models\Category;
use Illuminate\Support\Facades\DB;

class ListingController extends Controller
{
    /**
     * Menampilkan halaman listing dengan data random dari semua model.
     * Menggunakan algoritma optimized dengan database-level random sampling.
     */
    public function index(Request $request)
    {
        $perPage = 12; // Items per page
        $page = $request->get('page', 1);

        // Optimized: menggunakan UNION ALL dengan random sampling di database level
        // Lebih cepat karena randomisasi dilakukan di database, bukan di aplikasi
        $items = DB::query()
            ->fromSub(function ($query) use ($perPage, $page) {
                $offset = ($page - 1) * $perPage;
                $limit = $perPage * 2; // Ambil lebih banyak untuk di-shuffle

                // Events (tidak punya kolom price, gunakan NULL)
                $query->select(
                    'e.id',
                    'e.name',
                    DB::raw("NULL as price"),
                    'e.thumbnail',
                    'e.location',
                    'e.description',
                    DB::raw("'event' as type"),
                    DB::raw("'events' as type_slug"),
                    'e.created_at',
                    DB::raw("GROUP_CONCAT(ce.category_id) as category_ids")
                )
                ->from('events as e')
                ->leftJoin('category_event as ce', 'e.id', '=', 'ce.event_id')
                ->where('e.status', 'active')
                ->groupBy('e.id', 'e.name', 'e.thumbnail', 'e.location', 'e.description', 'e.created_at')
                ->inRandomOrder()
                ->limit($limit)

                // Services
                ->unionAll(
                    DB::table('services as s')
                        ->select(
                            's.id',
                            's.name',
                            's.price',
                            's.thumbnail',
                            's.location',
                            's.description',
                            DB::raw("'service' as type"),
                            DB::raw("'services' as type_slug"),
                            's.created_at',
                            DB::raw("GROUP_CONCAT(cp.category_id) as category_ids")
                        )
                        ->leftJoin('category_product as cp', function($join) {
                            $join->on('s.id', '=', 'cp.categorizable_id')
                                 ->where('cp.categorizable_type', '=', 'App\\Models\\Service');
                        })
                        ->where('s.status', 'active')
                        ->groupBy('s.id', 's.name', 's.price', 's.thumbnail', 's.location', 's.description', 's.created_at')
                        ->inRandomOrder()
                        ->limit($limit)
                )

                // Buildings
                ->unionAll(
                    DB::table('buildings as b')
                        ->select(
                            'b.id',
                            'b.name',
                            'b.price',
                            'b.thumbnail',
                            'b.location',
                            'b.description',
                            DB::raw("'building' as type"),
                            DB::raw("'buildings' as type_slug"),
                            'b.created_at',
                            DB::raw("GROUP_CONCAT(cp.category_id) as category_ids")
                        )
                        ->leftJoin('category_product as cp', function($join) {
                            $join->on('b.id', '=', 'cp.categorizable_id')
                                 ->where('cp.categorizable_type', '=', 'App\\Models\\Building');
                        })
                        ->where('b.status', 'active')
                        ->groupBy('b.id', 'b.name', 'b.price', 'b.thumbnail', 'b.location', 'b.description', 'b.created_at')
                        ->inRandomOrder()
                        ->limit($limit)
                )

                // property
                ->unionAll(
                    DB::table('rent_propertys as p')
                        ->select(
                            'p.id',
                            'p.name',
                            'p.price',
                            'p.thumbnail',
                            'p.location',
                            'p.description',
                            DB::raw("'property' as type"),
                            DB::raw("'propertys' as type_slug"),
                            'p.created_at',
                            DB::raw("GROUP_CONCAT(cp.category_id) as category_ids")
                        )
                        ->leftJoin('category_product as cp', function($join) {
                            $join->on('p.id', '=', 'cp.categorizable_id')
                                 ->where('cp.categorizable_type', '=', 'App\\Models\\RentProperty');
                        })
                        ->where('p.status', 'active')
                        ->groupBy('p.id', 'p.name', 'p.price', 'p.thumbnail', 'p.location', 'p.description', 'p.created_at')
                        ->inRandomOrder()
                        ->limit($limit)
                );
            }, 'combined')
            ->inRandomOrder() // Final shuffle
            ->paginate($perPage);

        // Ambil semua kategori aktif tanpa filter user
        $categories = Category::active()->withoutUserScope()->get();

        // Debug: Log kategori yang diambil
        \Log::info('Categories: ' . json_encode($categories->toArray()));
        
        // Debug: Log items yang diambil
        \Log::info('Items: ' . json_encode($items->toArray()));

        return Inertia::render('Listing/Index', [
            'items' => $items,
            'categories' => $categories,
        ]);
    }

    /**
     * Menampilkan halaman daftar berdasarkan tipe dari URL.
     */
    public function show(Request $request, string $type)
    {
        // Petakan 'type' dari URL ke Model dan Komponen React yang sesuai
        $config = match ($type) {
            'events'    => ['model' => Event::class, 'component' => 'Home/Events'],
            'services'   => ['model' => Service::class, 'component' => 'Home/Services'],
            'buildings'  => ['model' => Building::class, 'component' => 'Home/Building'],
            'propertys', 'property' => ['model' => RentProperty::class, 'component' => 'Home/Property'],
            default      => abort(404), // Tampilkan 404 jika tipe tidak valid
        };

        // Ambil data dari model yang benar dengan paginasi
        $items = $config['model']::latest()->paginate(12)->withQueryString();

        // Render komponen Inertia yang sesuai dengan datanya
        return Inertia::render($config['component'], [
            'items' => $items,
        ]);
    }
}