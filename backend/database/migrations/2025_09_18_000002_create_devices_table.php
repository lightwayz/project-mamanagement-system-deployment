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
        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->string('manufacturer')->nullable();
            $table->string('name');
            $table->string('category');
            $table->string('sub_category')->nullable();
            $table->string('brand')->nullable();
            $table->string('model')->nullable();
            $table->text('description')->nullable();
            $table->text('short_description')->nullable();
            $table->string('phase')->nullable();
            $table->decimal('cost_price', 10, 2)->default(0);
            $table->decimal('retail_price', 10, 2)->nullable();
            $table->decimal('markup', 10, 2)->nullable();
            $table->decimal('discount', 10, 2)->nullable();
            $table->decimal('selling_price', 10, 2)->default(0);
            $table->string('supplier')->nullable();
            $table->boolean('is_taxable')->default(true);
            $table->text('specifications')->nullable();
            $table->string('custom_field_1')->nullable();
            $table->string('custom_field_2')->nullable();
            $table->string('custom_field_3')->nullable();
            $table->string('image_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};
