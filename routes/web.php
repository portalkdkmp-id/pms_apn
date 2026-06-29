<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DivisionController;
use App\Http\Controllers\FlowActivityController;
use App\Http\Controllers\GanttChartController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectStatusController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', 'dashboard')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('flow-activities', [FlowActivityController::class, 'index'])->name('flow-activities.index');
    Route::get('flow-activities/flow-2', [FlowActivityController::class, 'flow2'])->name('flow-activities.flow-2');
    Route::get('flow-activities/timeline', [FlowActivityController::class, 'timeline'])->name('flow-activities.timeline');
    Route::get('gantt-chart', [GanttChartController::class, 'index'])->name('gantt-chart.index');

    Route::get('users/export', [UserController::class, 'export'])->name('users.export');
    Route::post('users/import', [UserController::class, 'import'])->name('users.import');
    Route::resource('users', UserController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('divisions', DivisionController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('roles', RoleController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('project-statuses', ProjectStatusController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('projects', ProjectController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('teams', TeamController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::get('tasks/pending', [TaskController::class, 'pending'])->name('tasks.pending');
    Route::post('tasks/{task}/approve', [TaskController::class, 'approve'])->name('tasks.approve');
    Route::resource('tasks', TaskController::class)->only(['index', 'store', 'update', 'destroy']);
});

require __DIR__.'/settings.php';
