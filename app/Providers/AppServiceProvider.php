<?php

namespace App\Providers;

use App\Helpers\Helper;
use Illuminate\Support\ServiceProvider;
use App\Models\Service;
use App\Models\Building;
use App\Models\RentProperty;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {

        // Force HTTPS untuk production
        if (config('app.env') === 'production' || request()->isSecure()) {
            URL::forceScheme('https');
        }

        // Jika menggunakan ngrok atau proxy, paksa HTTPS
        if (request()->header('x-forwarded-proto') === 'https' || request()->header('x-forwarded-ssl') === 'on') {
            URL::forceScheme('https');
        }

        \Broadcast::channel('online-users', function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'uuid' => $user->uuid,
                'last_seen_at' => Helper::userLastActivityStatus($user->last_seen_at),
            ];
        });

        Relation::morphMap([
            'ticket'        => \App\Models\Ticket::class,
            'service'       => \App\Models\Service::class,
            'building'      => \App\Models\Building::class,
            'property'      => \App\Models\RentProperty::class,
            'rent_property' => \App\Models\RentProperty::class,
            'itemPhoto'     => \App\Models\ItemPhoto::class,
            'user'          => \App\Models\User::class,
            'mitra'         => \App\Models\Mitra::class,
        ]);

        Relation::enforceMorphMap([
            'ticket'               => \App\Models\Ticket::class,
            'service'              => \App\Models\Service::class,
            'building'             => \App\Models\Building::class,
            'property'             => \App\Models\RentProperty::class,
            'rent_property'        => \App\Models\RentProperty::class,
            // Support legacy rows that stored full class names in item_type
            'App\Models\Service'   => \App\Models\Service::class,
            'App\Models\Building'  => \App\Models\Building::class,
            'App\Models\RentProperty' => \App\Models\RentProperty::class,
            'itemPhoto'            => \App\Models\ItemPhoto::class,
            'user'                 => \App\Models\User::class,
            'mitra'                => \App\Models\Mitra::class,
        ]);
    }
}
