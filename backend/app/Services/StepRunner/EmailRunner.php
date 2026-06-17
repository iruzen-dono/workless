<?php

namespace App\Services\StepRunner;

use Illuminate\Support\Facades\Mail;

class EmailRunner implements StepRunnerInterface
{
    public function run(array $input, array $config): array
    {
        $to = $config['to'] ?? '';
        $subject = $config['subject'] ?? 'No Subject';
        $body = $config['body'] ?? '';

        if (empty($to)) {
            return [
                'success' => false,
                'error' => 'Recipient email (to) is required.',
            ];
        }

        try {
            Mail::raw($body, function ($message) use ($to, $subject) {
                $message->to($to)
                    ->subject($subject);
            });

            return [
                'success' => true,
                'to' => $to,
                'subject' => $subject,
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
}
