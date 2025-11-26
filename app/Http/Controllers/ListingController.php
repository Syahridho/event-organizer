<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Event;
use App\Models\Service;
use App\Models\Building;
use App\Models\RentProperty;
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
                    'id',
                    'name',
                    DB::raw("NULL as price"),
                    'thumbnail',
                    'location',
                    'description',
                    DB::raw("'event' as type"),
                    DB::raw("'events' as type_slug"),
                    'created_at'
                )
                ->from('events')
                ->where('status', 'active')
                ->inRandomOrder()
                ->limit($limit)

                // Services
                ->unionAll(
                    DB::table('services')
                        ->select(
                            'id',
                            'name',
                            'price',
                            'thumbnail',
                            'location',
                            'description',
                            DB::raw("'service' as type"),
                            DB::raw("'services' as type_slug"),
                            'created_at'
                        )
                        ->where('status', 'active')
                        ->inRandomOrder()
                        ->limit($limit)
                )

                // Buildings
                ->unionAll(
                    DB::table('buildings')
                        ->select(
                            'id',
                            'name',
                            'price',
                            'thumbnail',
                            'location',
                            'description',
                            DB::raw("'building' as type"),
                            DB::raw("'buildings' as type_slug"),
                            'created_at'
                        )
                        ->where('status', 'active')
                        ->inRandomOrder()
                        ->limit($limit)
                )

                // property
                ->unionAll(
                    DB::table('rent_propertys')
                        ->select(
                            'id',
                            'name',
                            'price',
                            'thumbnail',
                            'location',
                            'description',
                            DB::raw("'property' as type"),
                            DB::raw("'propertys' as type_slug"),
                            'created_at'
                        )
                        ->where('status', 'active')
                        ->inRandomOrder()
                        ->limit($limit)
                );
            }, 'combined')
            ->inRandomOrder() // Final shuffle
            ->paginate($perPage);

        return Inertia::render('Listing/Index', [
            'items' => $items,
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