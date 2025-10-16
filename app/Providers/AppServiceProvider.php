<?php

namespace App\Providers;

use App\Helpers\Helper;
use Illuminate\Support\ServiceProvider;
use App\Models\Service;
use App\Models\Building;
use App\Models\RentProperties;
use Illuminate\Database\Eloquent\Relations\Relation;

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
            'ticket' => \App\Models\Ticket::class,
            'service' => \App\Models\Service::class,
            'building' => \App\Models\Building::class,
            'property' => \App\Models\RentProperties::class,
        ]);

        Relation::enforceMorphMap([
            'ticket'         => \App\Models\Ticket::class,
            'service'        => \App\Models\Service::class,
            'building'       => \App\Models\Building::class,
            'property'       => \App\Models\RentProperties::class,
            'rent_property'       => \App\Models\RentProperties::class,
            'itemPhoto'    => \App\Models\ItemPhoto::class,
            'service'        => 'App\Models\Service',
            'building'       => 'App\Models\Building',
            'App\Models\Building'       => \App\Models\Building::class,
            'rent_properties'=> 'App\Models\RentProperty',
            'user'           => \App\Models\User::class,
            'mitra'          => \App\Models\Mitra::class,
        ]);
    }
}
