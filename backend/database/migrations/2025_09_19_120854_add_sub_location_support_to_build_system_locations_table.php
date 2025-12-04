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
        Schema::table('build_system_locations', function (Blueprint $table) {
            // Add parent location relationship for hierarchical structure
            $table->unsignedBigInteger('parent_location_id')->nullable()->after('build_system_id');

            // Add level to track hierarchy depth (0 = main location, 1 = sub-location)
            $table->tinyInteger('level')->default(0)->after('parent_location_id');

            // Add foreign key constraint for parent location
            $table->foreign('parent_location_id')
                  ->references('id')
                  ->on('build_system_locations')
                  ->onDelete('cascade');

            // Add indexes for performance
            $table->index(['parent_location_id']);
            $table->index(['build_system_id', 'level']);
            $table->index(['build_system_id', 'parent_location_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('build_system_locations', function (Blueprint $table) {
            // Drop foreign key constraint first
            $table->dropForeign(['parent_location_id']);

            // Drop indexes
            $table->dropIndex(['parent_location_id']);
            $table->dropIndex(['build_system_id', 'level']);
            $table->dropIndex(['build_system_id', 'parent_location_id']);

            // Drop columns
            $table->dropColumn(['parent_location_id', 'level']);
        });
    }
};
