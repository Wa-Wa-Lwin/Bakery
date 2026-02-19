<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\StaffController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::get('/staff', [StaffController::class, 'index']);
Route::post('/staff', [StaffController::class, 'store']);
Route::patch('/staff/{id}', [StaffController::class, 'update']);
