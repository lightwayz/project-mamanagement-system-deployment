<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'password_changed_at',
        'password_expires_at',
        'force_password_change',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password_changed_at' => 'datetime',
        'password_expires_at' => 'datetime',
        'force_password_change' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function projects()
    {
        return $this->hasMany(Project::class, 'salesperson_id');
    }

    public function assignedTasks()
    {
        return $this->hasMany(Task::class, 'assigned_to');
    }

    public function uploadedFiles()
    {
        return $this->hasMany(ProjectFile::class, 'uploaded_by');
    }

    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    public function isSalesperson()
    {
        return $this->role === 'salesperson';
    }

    public function isTechnician()
    {
        return $this->role === 'technician';
    }

    public function hasRole($role)
    {
        return $this->role === $role;
    }

    /**
     * Check if the user's password is expired
     */
    public function isPasswordExpired()
    {
        if (!$this->password_expires_at) {
            return false;
        }
        
        return now()->gt($this->password_expires_at);
    }

    /**
     * Get days remaining until password expires
     */
    public function getDaysUntilPasswordExpires()
    {
        if (!$this->password_expires_at) {
            return null;
        }
        
        $daysRemaining = now()->diffInDays($this->password_expires_at, false);
        return $daysRemaining > 0 ? $daysRemaining : 0;
    }

    /**
     * Check if password is expiring soon (within 7 days)
     */
    public function isPasswordExpiringSoon()
    {
        $daysRemaining = $this->getDaysUntilPasswordExpires();
        return $daysRemaining !== null && $daysRemaining <= 7 && $daysRemaining > 0;
    }

    /**
     * Set password expiry date (90 days from user creation or password change date)
     */
    public function setPasswordExpiry($passwordChangedAt = null)
    {
        $passwordChangedAt = $passwordChangedAt ?? now();
        $this->password_changed_at = $passwordChangedAt;
        $this->password_expires_at = $passwordChangedAt->copy()->addDays(90);
        $this->force_password_change = false;
        $this->save();
    }

    /**
     * Calculate password expiry based on user creation date (90-day policy)
     */
    public function calculatePasswordExpiryFromCreation()
    {
        // For existing users without password_changed_at, use created_at
        $baseDate = $this->password_changed_at ?? $this->created_at;
        
        // Find the next 90-day boundary from creation date
        $creationDate = $this->created_at;
        $daysSinceCreation = $creationDate->diffInDays(now());
        $cyclesPassed = floor($daysSinceCreation / 90);
        $nextExpiryDate = $creationDate->copy()->addDays(($cyclesPassed + 1) * 90);
        
        return $nextExpiryDate;
    }

    /**
     * Get days remaining until password expires (based on creation date cycles)
     */
    public function getDaysUntilPasswordExpiresFromCreation()
    {
        $nextExpiryDate = $this->calculatePasswordExpiryFromCreation();
        $daysRemaining = now()->diffInDays($nextExpiryDate, false);
        return $daysRemaining > 0 ? $daysRemaining : 0;
    }

    /**
     * Check if password should expire based on 90-day cycles from creation date
     */
    public function isPasswordExpiredFromCreation()
    {
        return $this->getDaysUntilPasswordExpiresFromCreation() <= 0;
    }

    /**
     * Check if password is expiring soon based on creation date (within 7 days)
     */
    public function isPasswordExpiringSoonFromCreation()
    {
        $daysRemaining = $this->getDaysUntilPasswordExpiresFromCreation();
        return $daysRemaining <= 7 && $daysRemaining > 0;
    }

    /**
     * Force password change for next login
     */
    public function forcePasswordChange()
    {
        $this->force_password_change = true;
        $this->save();
    }
}