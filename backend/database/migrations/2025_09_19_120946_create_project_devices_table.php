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
        Schema::create('project_devices', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_location_id');
            $table->unsignedBigInteger('device_id');
            $table->integer('quantity')->default(1);
            $table->decimal('unit_price', 10, 2)->default(0);
            $table->decimal('total_price', 10, 2)->default(0);
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('project_location_id')->references('id')->on('project_locations')->onDelete('cascade');
            $table->foreign('device_id')->references('id')->on('devices')->onDelete('cascade');

            // Indexes for performance
            $table->index(['project_location_id']);
            $table->index(['device_id']);
            $table->index(['project_location_id', 'device_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_devices');
    }
};
