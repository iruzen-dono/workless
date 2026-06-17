<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Node.js Configuration
    |--------------------------------------------------------------------------
    |
    | Path to the Node.js binary used by the CodeRunner for executing user
    | JavaScript in a sandboxed VM environment.
    |
    */
    'node_path' => env('WORKLESS_NODE_PATH', 'node'),

    /*
    |--------------------------------------------------------------------------
    | Sandbox Script Path
    |--------------------------------------------------------------------------
    |
    | Path to the Node.js sandbox script that executes user code in an
    | isolated VM context with timeout.
    |
    */
    'sandbox_path' => env('WORKLESS_SANDBOX_PATH', resource_path('js/sandbox.cjs')),
];
