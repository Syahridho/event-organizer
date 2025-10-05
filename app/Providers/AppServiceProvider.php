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
        \Broadcast::channel('online-users', function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'uuid' => $user->uuid,
                'last_seen_at' => Helper::userLastActivityStatus($user->last_seen_at),
            ];
        });

        Relation::enforceMorphMap([
            'ticket'         => \App\Models\Ticket::class,
            'service'        => \App\Models\Service::class,
            'building'       => \App\Models\Building::class,
            'property'       => \App\Models\RentProperties::class,
            'service'        => 'App\Models\Service',
            'building'       => 'App\Models\Building',
            'App\Models\Building'       => \App\Models\Building::class,
            'rent_properties'=> 'App\Models\RentProperty',
            'user'           => \App\Models\User::class,
            'mitra'          => \App\Models\Mitra::class,
        ]);
    }
}
