<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\MenuItemController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\WasteController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\MenuChannelStatusController;
use Illuminate\Support\Facades\Route;

// Auth
Route::post('/login', [AuthController::class, 'login']);

// Staff
Route::get('/staff',        [StaffController::class, 'index']);
Route::post('/staff',       [StaffController::class, 'store']);
Route::patch('/staff/{id}', [StaffController::class, 'update']);

// Menu items
Route::get('/menu-items',        [MenuItemController::class, 'index']);
Route::get('/categories',        [MenuItemController::class, 'categories']);
Route::post('/menu-items',       [MenuItemController::class, 'store']);
Route::patch('/menu-items/{id}', [MenuItemController::class, 'update']);

// Menu channel statuses
Route::patch('/menu-channel-statuses/{itemId}/{orderTypeId}', [MenuChannelStatusController::class, 'update']);

// Orders (creates order + ordered_items + payment atomically)
Route::get('/orders',  [OrderController::class, 'index']);
Route::post('/orders', [OrderController::class, 'store']);

// Waste
Route::get('/waste',         [WasteController::class, 'index']);
Route::post('/waste',        [WasteController::class, 'store']);
Route::delete('/waste/{id}', [WasteController::class, 'destroy']);

// Audit log
Route::get('/audit-logs',  [AuditLogController::class, 'index']);
Route::post('/audit-logs', [AuditLogController::class, 'store']);
