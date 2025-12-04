<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Collection;

class PasswordExpiryService
{
    /**
     * Get password expiry status for a user
     */
    public function getPasswordExpiryStatus(User $user): array
    {
        return [
            'is_expired' => $user->isPasswordExpired(),
            'is_expiring_soon' => $user->isPasswordExpiringSoon(),
            'days_remaining' => $user->getDaysUntilPasswordExpires(),
            'password_changed_at' => $user->password_changed_at,
            'password_expires_at' => $user->password_expires_at,
            'force_password_change' => $user->force_password_change,
        ];
    }

    /**
     * Get all users whose passwords are expiring soon (within 7 days)
     */
    public function getUsersWithExpiringSoonPasswords(): Collection
    {
        return User::whereNotNull('password_expires_at')
            ->where('password_expires_at', '>', now())
            ->where('password_expires_at', '<=', now()->addDays(7))
            ->where('is_active', true)
            ->get();
    }

    /**
     * Get all users whose passwords have expired
     */
    public function getUsersWithExpiredPasswords(): Collection
    {
        return User::whereNotNull('password_expires_at')
            ->where('password_expires_at', '<', now())
            ->where('is_active', true)
            ->get();
    }

    /**
     * Initialize password expiry for existing users who don't have it set
     */
    public function initializePasswordExpiryForExistingUsers(): int
    {
        $users = User::whereNull('password_expires_at')
            ->where('is_active', true)
            ->get();

        $count = 0;
        foreach ($users as $user) {
            // Set expiry to 90 days from now for existing users
            // This gives them time to prepare for the new policy
            $user->setPasswordExpiry(now());
            $count++;
        }

        return $count;
    }

    /**
     * Force password change for expired passwords
     */
    public function forcePasswordChangeForExpiredUsers(): int
    {
        $expiredUsers = $this->getUsersWithExpiredPasswords();
        
        $count = 0;
        foreach ($expiredUsers as $user) {
            if (!$user->force_password_change) {
                $user->forcePasswordChange();
                $count++;
            }
        }

        return $count;
    }

    /**
     * Get notification message based on password expiry status
     */
    public function getPasswordExpiryNotification(User $user): ?array
    {
        if ($user->force_password_change) {
            return [
                'type' => 'error',
                'title' => 'Password Change Required',
                'message' => 'Your password has expired. Please change it immediately.',
                'action' => 'change_password',
                'priority' => 'high'
            ];
        }

        if ($user->isPasswordExpired()) {
            return [
                'type' => 'error',
                'title' => 'Password Expired',
                'message' => 'Your password has expired. Please change it as soon as possible.',
                'action' => 'change_password',
                'priority' => 'high'
            ];
        }

        if ($user->isPasswordExpiringSoon()) {
            $daysRemaining = $user->getDaysUntilPasswordExpires();
            $message = $daysRemaining === 1 
                ? 'Your password expires tomorrow. Please change it soon.'
                : "Your password expires in {$daysRemaining} days. Please change it soon.";

            return [
                'type' => 'warning',
                'title' => 'Password Expiring Soon',
                'message' => $message,
                'action' => 'change_password',
                'priority' => 'medium',
                'days_remaining' => $daysRemaining
            ];
        }

        return null;
    }
}