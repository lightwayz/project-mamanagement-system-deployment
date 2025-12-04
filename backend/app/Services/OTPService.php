<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use App\Models\User;
use Carbon\Carbon;

class OTPService
{
    const OTP_EXPIRY_MINUTES = 10;
    const OTP_LENGTH = 6;
    const MAX_ATTEMPTS = 3;

    public function generateOTP(User $user, string $action = 'password_change'): string
    {
        $otp = str_pad(random_int(0, 999999), self::OTP_LENGTH, '0', STR_PAD_LEFT);
        
        $key = $this->getOTPKey($user->id, $action);
        
        Cache::put($key, [
            'otp' => $otp,
            'attempts' => 0,
            'created_at' => Carbon::now(),
        ], now()->addMinutes(self::OTP_EXPIRY_MINUTES));

        return $otp;
    }

    public function sendOTP(User $user, string $otp, string $action = 'password_change'): bool
    {
        try {
            $subject = $this->getEmailSubject($action);
            $message = $this->getEmailMessage($otp, $action);

            Mail::send([], [], function ($message) use ($user, $subject, $otp, $action) {
                $message->to($user->email, $user->name)
                    ->subject($subject)
                    ->html($this->getEmailHTML($user, $otp, $action));
            });

            return true;
        } catch (\Exception $e) {
            \Log::error('Failed to send OTP email: ' . $e->getMessage());
            return false;
        }
    }

    public function verifyOTP(User $user, string $otp, string $action = 'password_change'): bool
    {
        $key = $this->getOTPKey($user->id, $action);
        $data = Cache::get($key);

        if (!$data) {
            return false;
        }

        // Check if too many attempts
        if ($data['attempts'] >= self::MAX_ATTEMPTS) {
            Cache::forget($key);
            return false;
        }

        // Check if OTP is expired
        if (Carbon::now()->diffInMinutes($data['created_at']) > self::OTP_EXPIRY_MINUTES) {
            Cache::forget($key);
            return false;
        }

        // Check if OTP matches
        if ($data['otp'] !== $otp) {
            $data['attempts']++;
            Cache::put($key, $data, now()->addMinutes(self::OTP_EXPIRY_MINUTES));
            return false;
        }

        // OTP is valid, remove it from cache
        Cache::forget($key);
        return true;
    }

    public function getRemainingAttempts(User $user, string $action = 'password_change'): int
    {
        $key = $this->getOTPKey($user->id, $action);
        $data = Cache::get($key);

        if (!$data) {
            return self::MAX_ATTEMPTS;
        }

        return max(0, self::MAX_ATTEMPTS - $data['attempts']);
    }

    public function isOTPExpired(User $user, string $action = 'password_change'): bool
    {
        $key = $this->getOTPKey($user->id, $action);
        $data = Cache::get($key);

        if (!$data) {
            return true;
        }

        return Carbon::now()->diffInMinutes($data['created_at']) > self::OTP_EXPIRY_MINUTES;
    }

    private function getOTPKey(int $userId, string $action): string
    {
        return "otp:{$userId}:{$action}";
    }

    private function getEmailSubject(string $action): string
    {
        switch ($action) {
            case 'password_change':
                return 'Password Change Verification - Hometronix';
            case 'admin_password_reset':
                return 'Admin Password Reset Verification - Hometronix';
            default:
                return 'Verification Code - Hometronix';
        }
    }

    private function getEmailMessage(string $otp, string $action): string
    {
        switch ($action) {
            case 'password_change':
                return "Your verification code for password change is: {$otp}";
            case 'admin_password_reset':
                return "Your verification code for admin password reset is: {$otp}";
            default:
                return "Your verification code is: {$otp}";
        }
    }

    private function getEmailHTML(User $user, string $otp, string $action): string
    {
        $actionText = $action === 'password_change' ? 'change your password' : 'reset a user password';
        
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <title>Verification Code</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
                .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { text-align: center; margin-bottom: 30px; }
                .logo { font-size: 24px; font-weight: bold; color: #3f51b5; }
                .otp-code { font-size: 36px; font-weight: bold; text-align: center; color: #3f51b5; background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; letter-spacing: 8px; }
                .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <div class='logo'>Hometronix</div>
                    <h2>Verification Code</h2>
                </div>
                
                <p>Hello {$user->name},</p>
                
                <p>You have requested to {$actionText}. Please use the following verification code to complete this action:</p>
                
                <div class='otp-code'>{$otp}</div>
                
                <div class='warning'>
                    <strong>Security Notice:</strong>
                    <ul>
                        <li>This code will expire in " . self::OTP_EXPIRY_MINUTES . " minutes</li>
                        <li>You have " . self::MAX_ATTEMPTS . " attempts to enter the correct code</li>
                        <li>If you didn't request this action, please ignore this email</li>
                    </ul>
                </div>
                
                <p>If you have any questions or concerns, please contact your system administrator.</p>
                
                <div class='footer'>
                    <p>This is an automated message from Hometronix System.</p>
                    <p>Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>";
    }
}