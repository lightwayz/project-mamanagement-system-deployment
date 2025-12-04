<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create settings table if it doesn't exist
        if (!Schema::hasTable('settings')) {
            Schema::create('settings', function (Blueprint $table) {
                $table->id();
                $table->string('company_name')->nullable();
                $table->text('company_address')->nullable();
                $table->string('company_phone')->nullable();
                $table->string('company_email')->nullable();
                $table->string('currency')->default('₦');
                $table->decimal('tax_rate', 5, 2)->default(7.50);
                $table->string('default_company_logo_path')->nullable();
                $table->text('contract_terms')->nullable();
                $table->timestamps();
            });
        } else {
            // Add new columns to existing settings table
            Schema::table('settings', function (Blueprint $table) {
                if (!Schema::hasColumn('settings', 'company_address')) {
                    $table->text('company_address')->nullable();
                }
                if (!Schema::hasColumn('settings', 'company_phone')) {
                    $table->string('company_phone')->nullable();
                }
                if (!Schema::hasColumn('settings', 'company_email')) {
                    $table->string('company_email')->nullable();
                }
                if (!Schema::hasColumn('settings', 'tax_rate')) {
                    $table->decimal('tax_rate', 5, 2)->default(7.50);
                }
                if (!Schema::hasColumn('settings', 'default_company_logo_path')) {
                    $table->string('default_company_logo_path')->nullable();
                }
                if (!Schema::hasColumn('settings', 'contract_terms')) {
                    $table->text('contract_terms')->nullable();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('settings')) {
            Schema::table('settings', function (Blueprint $table) {
                $columns = [
                    'company_address',
                    'company_phone',
                    'company_email',
                    'tax_rate',
                    'default_company_logo_path',
                    'contract_terms'
                ];

                foreach ($columns as $column) {
                    if (Schema::hasColumn('settings', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
