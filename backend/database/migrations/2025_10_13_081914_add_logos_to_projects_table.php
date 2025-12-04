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
        Schema::table('projects', function (Blueprint $table) {
            $table->string('company_logo_path')->nullable()->after('status');
            $table->string('client_logo_path')->nullable()->after('company_logo_path');
            $table->string('project_image_path')->nullable()->after('client_logo_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['company_logo_path', 'client_logo_path', 'project_image_path']);
        });
    }
};
