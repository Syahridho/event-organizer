<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        @php($adminSetting = \App\Models\AdminSetting::first())
        @if($adminSetting && $adminSetting->logo)
                    <link rel="icon" type="image/png" href="{{ asset('storage/seo/' . $adminSetting->logo) }}">
        @else
                    <link rel="icon" href="{{ asset('favicon.ico') }}">
        @endif
        
                <title inertia>{{ $adminSetting ? $adminSetting->seo_title : config('app.name', 'Event Organizers') }}</title>
                <meta name="csrf-token" content="{{ csrf_token() }}">
                
                <!-- SEO Meta Tags -->
                @if($adminSetting && $adminSetting->seo_description)
                <meta name="description" content="{{ $adminSetting->seo_description }}">
                @endif
        <meta name="theme-color" content="#ffffff">
        
        <!-- Optimized Font Loading -->
        <link rel="preconnect" href="https://fonts.bunny.net" crossorigin>
        <link rel="dns-prefetch" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=inter:100,200,300,400,500,600,700,800,900&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx'])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
