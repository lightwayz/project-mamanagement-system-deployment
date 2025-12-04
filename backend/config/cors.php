<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:4200',
        'http://127.0.0.1:4200',
        'http://localhost:4201',
        'http://127.0.0.1:4201',
        'http://localhost:4202',
        'http://127.0.0.1:4202',
        'http://localhost:4203',
        'http://127.0.0.1:4203',
        'http://localhost:4300',
        'http://127.0.0.1:4300',
        'http://localhost:4500',
        'http://127.0.0.1:4500',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://pms.webtechassets.com',
        'http://pms.webtechassets.com',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];