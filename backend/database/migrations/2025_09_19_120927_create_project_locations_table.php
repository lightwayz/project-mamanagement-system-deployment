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
        Schema::create('project_locations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->unsignedBigInteger('parent_location_id')->nullable();
            $table->tinyInteger('level')->default(0);
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
            $table->foreign('parent_location_id')->references('id')->on('project_locations')->onDelete('cascade');

            // Indexes for performance
            $table->index(['project_id']);
            $table->index(['parent_location_id']);
            $table->index(['project_id', 'level']);
            $table->index(['project_id', 'parent_location_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_locations');
    }
};
