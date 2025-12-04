<?php

namespace App\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Models\Project;
use App\Models\Device;
use App\Models\Client;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Color;

class ReportsController extends Controller
{
    /**
     * Get project statistics
     */
    public function getProjectStats(): JsonResponse
    {
        try {
            $total = Project::count();
            $active = Project::where('status', 'active')->count();
            $completed = Project::where('status', 'completed')->count();
            $cancelled = Project::where('status', 'cancelled')->count();
            $pending = Project::where('status', 'pending')->count();

            return response()->json([
                'total' => $total,
                'active' => $active,
                'completed' => $completed,
                'cancelled' => $cancelled,
                'pending' => $pending
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch project stats',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get revenue statistics
     */
    public function getRevenueStats(): JsonResponse
    {
        try {
            // Get current date using Carbon for accurate date handling
            $now = now();
            $currentYear = $now->year;
            $currentMonth = $now->month;

            // Calculate start and end of current month
            $monthStart = $now->copy()->startOfMonth();
            $monthEnd = $now->copy()->endOfMonth();

            // Calculate start and end of current year
            $yearStart = $now->copy()->startOfYear();
            $yearEnd = $now->copy()->endOfYear();

            // Total revenue (all projects)
            $total = Project::sum('total_cost') ?? 0;

            // This month's revenue (projects created between first and last day of current month)
            $monthly = Project::whereBetween('created_at', [$monthStart, $monthEnd])
                             ->sum('total_cost') ?? 0;

            // This year's revenue (projects created between first and last day of current year)
            $yearly = Project::whereBetween('created_at', [$yearStart, $yearEnd])
                            ->sum('total_cost') ?? 0;

            \Log::info('Revenue Stats Calculation', [
                'current_date' => $now->toDateTimeString(),
                'month_range' => [$monthStart->toDateString(), $monthEnd->toDateString()],
                'year_range' => [$yearStart->toDateString(), $yearEnd->toDateString()],
                'total' => $total,
                'monthly' => $monthly,
                'yearly' => $yearly,
                'total_projects' => Project::count(),
                'monthly_projects' => Project::whereBetween('created_at', [$monthStart, $monthEnd])->count(),
                'yearly_projects' => Project::whereBetween('created_at', [$yearStart, $yearEnd])->count()
            ]);

            return response()->json([
                'total' => $total,
                'monthly' => $monthly,
                'yearly' => $yearly
            ]);

        } catch (\Exception $e) {
            \Log::error('Revenue stats calculation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Failed to fetch revenue stats',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get device statistics
     */
    public function getDeviceStats(): JsonResponse
    {
        try {
            $total = Device::where('is_active', true)->count();
            $categories = Device::where('is_active', true)
                               ->distinct('category')
                               ->count('category');
            $low_stock = 0; // Can be enhanced with inventory tracking

            return response()->json([
                'total' => $total,
                'categories' => $categories,
                'low_stock' => $low_stock
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch device stats',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export project report
     */
    public function exportProjectReport(Request $request)
    {
        try {
            $format = $request->query('format', 'excel');

            $projects = Project::with(['client', 'salesperson', 'locations.devices'])
                             ->orderBy('created_at', 'desc')
                             ->get();

            if ($format === 'pdf') {
                return $this->generateProjectPDF($projects);
            } else {
                return $this->generateProjectExcel($projects);
            }

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to generate project report',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export revenue report
     */
    public function exportRevenueReport(Request $request)
    {
        try {
            $format = $request->query('format', 'excel');

            $projects = Project::with('client')
                             ->orderBy('created_at', 'desc')
                             ->get();

            if ($format === 'pdf') {
                return $this->generateRevenuePDF($projects);
            } else {
                return $this->generateRevenueExcel($projects);
            }

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to generate revenue report',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export device report with pricing calculations
     */
    public function exportDeviceReport(Request $request)
    {
        try {
            $data = $request->json()->all();
            $format = $data['format'] ?? 'excel';
            $devices = $data['devices'] ?? [];

            if (empty($devices)) {
                // Fallback: get devices from database if not provided
                $devices = Device::where('is_active', true)
                                ->orderBy('category')
                                ->orderBy('brand')
                                ->orderBy('name')
                                ->get()
                                ->toArray();
            }

            if ($format === 'pdf') {
                return $this->generateDevicePDF($devices);
            } else {
                return $this->generateDeviceExcel($devices);
            }

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to generate device report',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate Project Report PDF
     */
    private function generateProjectPDF($projects)
    {
        $settings = Setting::first();
        $totalProjects = $projects->count();
        $totalRevenue = $projects->sum('total_cost');
        $activeProjects = $projects->where('status', 'active')->count();
        $completedProjects = $projects->where('status', 'completed')->count();

        $html = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Project Report</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 10pt; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                .header h1 { margin: 0; color: #333; font-size: 24pt; }
                .header p { margin: 5px 0; color: #666; }
                .summary { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
                .summary-row { display: flex; justify-content: space-between; margin: 8px 0; }
                .summary-label { font-weight: bold; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background: #333; color: white; padding: 10px; text-align: left; font-weight: bold; }
                td { padding: 8px; border-bottom: 1px solid #ddd; }
                tr:nth-child(even) { background: #f9f9f9; }
                .status-active { color: #4CAF50; font-weight: bold; }
                .status-completed { color: #2196F3; font-weight: bold; }
                .status-cancelled { color: #f44336; font-weight: bold; }
                .status-pending { color: #FF9800; font-weight: bold; }
                .footer { margin-top: 30px; text-align: center; color: #666; font-size: 9pt; border-top: 1px solid #ddd; padding-top: 10px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Project Report</h1>
                <p>' . ($settings->company_name ?? 'Hometronix Nigeria Limited') . '</p>
                <p>Generated on ' . date('F d, Y') . '</p>
            </div>

            <div class="summary">
                <h3 style="margin-top: 0;">Summary</h3>
                <div class="summary-row">
                    <span class="summary-label">Total Projects:</span>
                    <span>' . $totalProjects . '</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Active Projects:</span>
                    <span>' . $activeProjects . '</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Completed Projects:</span>
                    <span>' . $completedProjects . '</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Total Revenue:</span>
                    <span>₦' . number_format($totalRevenue, 2) . '</span>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Project Name</th>
                        <th>Client</th>
                        <th>Status</th>
                        <th>Start Date</th>
                        <th>Total Cost</th>
                        <th>Devices</th>
                    </tr>
                </thead>
                <tbody>';

        foreach ($projects as $project) {
            $deviceCount = $project->locations->sum(function($location) {
                return $location->devices->count();
            });

            $statusClass = 'status-' . $project->status;

            $html .= '
                    <tr>
                        <td>' . htmlspecialchars($project->name) . '</td>
                        <td>' . htmlspecialchars($project->client->name ?? 'N/A') . '</td>
                        <td class="' . $statusClass . '">' . ucfirst($project->status) . '</td>
                        <td>' . ($project->start_date ? date('M d, Y', strtotime($project->start_date)) : 'N/A') . '</td>
                        <td>₦' . number_format($project->total_cost, 2) . '</td>
                        <td>' . $deviceCount . '</td>
                    </tr>';
        }

        $html .= '
                </tbody>
            </table>

            <div class="footer">
                <p>This is an automated report generated by Hometronix Project Management System</p>
            </div>
        </body>
        </html>';

        $pdf = Pdf::loadHTML($html);
        $pdf->setPaper('A4', 'landscape');

        return $pdf->download('project-report-' . date('Y-m-d') . '.pdf');
    }

    /**
     * Generate Project Report Excel
     */
    private function generateProjectExcel($projects)
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Projects Report');

        // Header styling
        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 12],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '333333']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]]
        ];

        // Title
        $sheet->mergeCells('A1:G1');
        $sheet->setCellValue('A1', 'PROJECT REPORT - ' . date('F d, Y'));
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 16],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
        ]);

        // Summary
        $row = 3;
        $totalRevenue = $projects->sum('total_cost');
        $sheet->setCellValue('A' . $row, 'Total Projects:');
        $sheet->setCellValue('B' . $row, $projects->count());
        $row++;
        $sheet->setCellValue('A' . $row, 'Active Projects:');
        $sheet->setCellValue('B' . $row, $projects->where('status', 'active')->count());
        $row++;
        $sheet->setCellValue('A' . $row, 'Total Revenue:');
        $sheet->setCellValue('B' . $row, '₦' . number_format($totalRevenue, 2));
        $row += 2;

        // Column headers
        $headers = ['Project Name', 'Client', 'Status', 'Start Date', 'End Date', 'Total Cost', 'Device Count'];
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . $row, $header);
            $col++;
        }
        $sheet->getStyle('A' . $row . ':G' . $row)->applyFromArray($headerStyle);

        // Data rows
        $row++;
        foreach ($projects as $project) {
            $deviceCount = $project->locations->sum(function($location) {
                return $location->devices->count();
            });

            $sheet->setCellValue('A' . $row, $project->name);
            $sheet->setCellValue('B' . $row, $project->client->name ?? 'N/A');
            $sheet->setCellValue('C' . $row, ucfirst($project->status));
            $sheet->setCellValue('D' . $row, $project->start_date ? date('M d, Y', strtotime($project->start_date)) : 'N/A');
            $sheet->setCellValue('E' . $row, $project->end_date ? date('M d, Y', strtotime($project->end_date)) : 'N/A');
            $sheet->setCellValue('F' . $row, '₦' . number_format($project->total_cost, 2));
            $sheet->setCellValue('G' . $row, $deviceCount);

            // Status color coding
            $statusColors = [
                'active' => '4CAF50',
                'completed' => '2196F3',
                'cancelled' => 'f44336',
                'pending' => 'FF9800'
            ];
            if (isset($statusColors[$project->status])) {
                $sheet->getStyle('C' . $row)->getFont()->getColor()->setRGB($statusColors[$project->status]);
            }

            $row++;
        }

        // Auto-size columns
        foreach (range('A', 'G') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Generate and download
        $writer = new Xlsx($spreadsheet);
        $filename = 'project-report-' . date('Y-m-d') . '.xlsx';
        $tempFile = tempnam(sys_get_temp_dir(), 'project_report');
        $writer->save($tempFile);

        return response()->download($tempFile, $filename)->deleteFileAfterSend(true);
    }

    /**
     * Generate Revenue Report PDF
     */
    private function generateRevenuePDF($projects)
    {
        $settings = Setting::first();

        // Calculate revenue by month
        $revenueByMonth = [];
        foreach ($projects as $project) {
            $month = date('Y-m', strtotime($project->created_at));
            if (!isset($revenueByMonth[$month])) {
                $revenueByMonth[$month] = 0;
            }
            $revenueByMonth[$month] += $project->total_cost;
        }
        ksort($revenueByMonth);

        // Calculate revenue by client
        $revenueByClient = [];
        foreach ($projects as $project) {
            $clientName = $project->client->name ?? 'No Client';
            if (!isset($revenueByClient[$clientName])) {
                $revenueByClient[$clientName] = 0;
            }
            $revenueByClient[$clientName] += $project->total_cost;
        }
        arsort($revenueByClient);
        $topClients = array_slice($revenueByClient, 0, 10, true);

        $totalRevenue = $projects->sum('total_cost');
        $averageProjectValue = $projects->count() > 0 ? $totalRevenue / $projects->count() : 0;

        $html = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Revenue Report</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 10pt; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                .header h1 { margin: 0; color: #333; font-size: 24pt; }
                .header p { margin: 5px 0; color: #666; }
                .summary { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
                .summary-row { display: flex; justify-content: space-between; margin: 8px 0; }
                .summary-label { font-weight: bold; }
                .section { margin: 30px 0; }
                .section h3 { color: #333; border-bottom: 2px solid #333; padding-bottom: 5px; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th { background: #333; color: white; padding: 10px; text-align: left; font-weight: bold; }
                td { padding: 8px; border-bottom: 1px solid #ddd; }
                tr:nth-child(even) { background: #f9f9f9; }
                .amount { text-align: right; font-weight: bold; color: #4CAF50; }
                .footer { margin-top: 30px; text-align: center; color: #666; font-size: 9pt; border-top: 1px solid #ddd; padding-top: 10px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Revenue Report</h1>
                <p>' . ($settings->company_name ?? 'Hometronix Nigeria Limited') . '</p>
                <p>Generated on ' . date('F d, Y') . '</p>
            </div>

            <div class="summary">
                <h3 style="margin-top: 0;">Revenue Summary</h3>
                <div class="summary-row">
                    <span class="summary-label">Total Revenue:</span>
                    <span class="amount">₦' . number_format($totalRevenue, 2) . '</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Total Projects:</span>
                    <span>' . $projects->count() . '</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Average Project Value:</span>
                    <span class="amount">₦' . number_format($averageProjectValue, 2) . '</span>
                </div>
            </div>

            <div class="section">
                <h3>Revenue by Month</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Month</th>
                            <th style="text-align: right;">Revenue</th>
                        </tr>
                    </thead>
                    <tbody>';

        foreach ($revenueByMonth as $month => $revenue) {
            $html .= '
                        <tr>
                            <td>' . date('F Y', strtotime($month . '-01')) . '</td>
                            <td class="amount">₦' . number_format($revenue, 2) . '</td>
                        </tr>';
        }

        $html .= '
                    </tbody>
                </table>
            </div>

            <div class="section">
                <h3>Top 10 Clients by Revenue</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Client Name</th>
                            <th style="text-align: right;">Total Revenue</th>
                        </tr>
                    </thead>
                    <tbody>';

        foreach ($topClients as $clientName => $revenue) {
            $html .= '
                        <tr>
                            <td>' . htmlspecialchars($clientName) . '</td>
                            <td class="amount">₦' . number_format($revenue, 2) . '</td>
                        </tr>';
        }

        $html .= '
                    </tbody>
                </table>
            </div>

            <div class="footer">
                <p>This is an automated report generated by Hometronix Project Management System</p>
            </div>
        </body>
        </html>';

        $pdf = Pdf::loadHTML($html);
        $pdf->setPaper('A4', 'portrait');

        return $pdf->download('revenue-report-' . date('Y-m-d') . '.pdf');
    }

    /**
     * Generate Revenue Report Excel
     */
    private function generateRevenueExcel($projects)
    {
        $spreadsheet = new Spreadsheet();

        // Summary Sheet
        $summarySheet = $spreadsheet->getActiveSheet();
        $summarySheet->setTitle('Summary');

        $totalRevenue = $projects->sum('total_cost');
        $averageProjectValue = $projects->count() > 0 ? $totalRevenue / $projects->count() : 0;

        $summarySheet->mergeCells('A1:B1');
        $summarySheet->setCellValue('A1', 'REVENUE REPORT - ' . date('F d, Y'));
        $summarySheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 16],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
        ]);

        $row = 3;
        $summarySheet->setCellValue('A' . $row, 'Total Revenue:');
        $summarySheet->setCellValue('B' . $row, '₦' . number_format($totalRevenue, 2));
        $summarySheet->getStyle('B' . $row)->getFont()->getColor()->setRGB('4CAF50');
        $row++;
        $summarySheet->setCellValue('A' . $row, 'Total Projects:');
        $summarySheet->setCellValue('B' . $row, $projects->count());
        $row++;
        $summarySheet->setCellValue('A' . $row, 'Average Project Value:');
        $summarySheet->setCellValue('B' . $row, '₦' . number_format($averageProjectValue, 2));

        $summarySheet->getColumnDimension('A')->setAutoSize(true);
        $summarySheet->getColumnDimension('B')->setAutoSize(true);

        // By Month Sheet
        $monthSheet = $spreadsheet->createSheet();
        $monthSheet->setTitle('By Month');

        $revenueByMonth = [];
        foreach ($projects as $project) {
            $month = date('Y-m', strtotime($project->created_at));
            if (!isset($revenueByMonth[$month])) {
                $revenueByMonth[$month] = 0;
            }
            $revenueByMonth[$month] += $project->total_cost;
        }
        ksort($revenueByMonth);

        $monthSheet->setCellValue('A1', 'Month');
        $monthSheet->setCellValue('B1', 'Revenue');
        $monthSheet->getStyle('A1:B1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '333333']]
        ]);

        $row = 2;
        foreach ($revenueByMonth as $month => $revenue) {
            $monthSheet->setCellValue('A' . $row, date('F Y', strtotime($month . '-01')));
            $monthSheet->setCellValue('B' . $row, '₦' . number_format($revenue, 2));
            $row++;
        }

        $monthSheet->getColumnDimension('A')->setAutoSize(true);
        $monthSheet->getColumnDimension('B')->setAutoSize(true);

        // By Client Sheet
        $clientSheet = $spreadsheet->createSheet();
        $clientSheet->setTitle('By Client');

        $revenueByClient = [];
        foreach ($projects as $project) {
            $clientName = $project->client->name ?? 'No Client';
            if (!isset($revenueByClient[$clientName])) {
                $revenueByClient[$clientName] = 0;
            }
            $revenueByClient[$clientName] += $project->total_cost;
        }
        arsort($revenueByClient);

        $clientSheet->setCellValue('A1', 'Client Name');
        $clientSheet->setCellValue('B1', 'Total Revenue');
        $clientSheet->getStyle('A1:B1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '333333']]
        ]);

        $row = 2;
        foreach ($revenueByClient as $clientName => $revenue) {
            $clientSheet->setCellValue('A' . $row, $clientName);
            $clientSheet->setCellValue('B' . $row, '₦' . number_format($revenue, 2));
            $row++;
        }

        $clientSheet->getColumnDimension('A')->setAutoSize(true);
        $clientSheet->getColumnDimension('B')->setAutoSize(true);

        // Generate and download
        $writer = new Xlsx($spreadsheet);
        $filename = 'revenue-report-' . date('Y-m-d') . '.xlsx';
        $tempFile = tempnam(sys_get_temp_dir(), 'revenue_report');
        $writer->save($tempFile);

        return response()->download($tempFile, $filename)->deleteFileAfterSend(true);
    }

    /**
     * Generate Device Report PDF
     */
    private function generateDevicePDF($devices)
    {
        $settings = Setting::first();
        $totalDevices = count($devices);
        $totalInventoryValue = array_sum(array_column($devices, 'cost_price'));
        $totalPotentialRevenue = 0;
        $totalProfit = 0;

        foreach ($devices as $device) {
            $sellingPrice = $device['calculated_selling_price'] ?? $device['selling_price'] ?? 0;
            $costPrice = $device['cost_price'] ?? 0;
            $totalPotentialRevenue += $sellingPrice;
            $totalProfit += ($sellingPrice - $costPrice);
        }

        $html = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Device Inventory Report</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 9pt; }
                .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                .header h1 { margin: 0; color: #333; font-size: 20pt; }
                .header p { margin: 5px 0; color: #666; }
                .summary { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
                .summary-row { display: flex; justify-content: space-between; margin: 6px 0; }
                .summary-label { font-weight: bold; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 8pt; }
                th { background: #333; color: white; padding: 6px; text-align: left; font-weight: bold; }
                td { padding: 5px; border-bottom: 1px solid #ddd; }
                tr:nth-child(even) { background: #f9f9f9; }
                .profit { color: #4CAF50; font-weight: bold; }
                .loss { color: #f44336; font-weight: bold; }
                .amount { text-align: right; }
                .footer { margin-top: 20px; text-align: center; color: #666; font-size: 8pt; border-top: 1px solid #ddd; padding-top: 10px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Device Inventory Report with Pricing</h1>
                <p>' . ($settings->company_name ?? 'Hometronix Nigeria Limited') . '</p>
                <p>Generated on ' . date('F d, Y') . '</p>
            </div>

            <div class="summary">
                <h3 style="margin-top: 0;">Inventory Summary</h3>
                <div class="summary-row">
                    <span class="summary-label">Total Devices:</span>
                    <span>' . $totalDevices . '</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Total Inventory Value (Cost):</span>
                    <span>₦' . number_format($totalInventoryValue, 2) . '</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Total Potential Revenue:</span>
                    <span>₦' . number_format($totalPotentialRevenue, 2) . '</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Total Potential Profit:</span>
                    <span class="profit">₦' . number_format($totalProfit, 2) . '</span>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Device Name</th>
                        <th>Brand</th>
                        <th>Category</th>
                        <th style="text-align: right;">Cost</th>
                        <th style="text-align: right;">MSRP</th>
                        <th style="text-align: right;">Markup</th>
                        <th style="text-align: right;">Selling</th>
                        <th style="text-align: right;">Profit/Loss</th>
                    </tr>
                </thead>
                <tbody>';

        foreach ($devices as $device) {
            $costPrice = $device['cost_price'] ?? 0;
            $msrp = $device['msrp'] ?? $device['retail_price'] ?? 0;
            $markup = $device['markup'] ?? 0;
            $sellingPrice = $device['calculated_selling_price'] ?? $device['selling_price'] ?? 0;
            $profitLoss = $device['profit_loss'] ?? ($sellingPrice - $costPrice);
            $isProfitable = $profitLoss >= 0;

            $html .= '
                    <tr>
                        <td>' . htmlspecialchars($device['name'] ?? 'N/A') . '</td>
                        <td>' . htmlspecialchars($device['brand'] ?? 'N/A') . '</td>
                        <td>' . htmlspecialchars(ucfirst($device['category'] ?? 'N/A')) . '</td>
                        <td class="amount">₦' . number_format($costPrice, 2) . '</td>
                        <td class="amount">₦' . number_format($msrp, 2) . '</td>
                        <td class="amount">' . number_format($markup, 1) . '%</td>
                        <td class="amount">₦' . number_format($sellingPrice, 2) . '</td>
                        <td class="amount ' . ($isProfitable ? 'profit' : 'loss') . '">₦' . number_format($profitLoss, 2) . '</td>
                    </tr>';
        }

        $html .= '
                </tbody>
            </table>

            <div class="footer">
                <p>This is an automated report generated by Hometronix Project Management System</p>
                <p><span class="profit">Green</span> indicates profit | <span class="loss">Red</span> indicates loss</p>
            </div>
        </body>
        </html>';

        $pdf = Pdf::loadHTML($html);
        $pdf->setPaper('A4', 'landscape');

        return $pdf->download('device-report-' . date('Y-m-d') . '.pdf');
    }

    /**
     * Generate Device Report Excel
     */
    private function generateDeviceExcel($devices)
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Device Report');

        // Title
        $sheet->mergeCells('A1:I1');
        $sheet->setCellValue('A1', 'DEVICE INVENTORY REPORT WITH PRICING - ' . date('F d, Y'));
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 14],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
        ]);

        // Summary
        $totalDevices = count($devices);
        $totalInventoryValue = array_sum(array_column($devices, 'cost_price'));
        $totalProfit = 0;
        foreach ($devices as $device) {
            $sellingPrice = $device['calculated_selling_price'] ?? $device['selling_price'] ?? 0;
            $costPrice = $device['cost_price'] ?? 0;
            $totalProfit += ($sellingPrice - $costPrice);
        }

        $row = 3;
        $sheet->setCellValue('A' . $row, 'Total Devices:');
        $sheet->setCellValue('B' . $row, $totalDevices);
        $row++;
        $sheet->setCellValue('A' . $row, 'Total Inventory Value:');
        $sheet->setCellValue('B' . $row, '₦' . number_format($totalInventoryValue, 2));
        $row++;
        $sheet->setCellValue('A' . $row, 'Total Potential Profit:');
        $sheet->setCellValue('B' . $row, '₦' . number_format($totalProfit, 2));
        $sheet->getStyle('B' . $row)->getFont()->getColor()->setRGB('4CAF50');
        $row += 2;

        // Column headers
        $headers = ['Name', 'Brand', 'Model', 'Category', 'Cost Price', 'MSRP', 'Markup %', 'Selling Price', 'Profit/Loss'];
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . $row, $header);
            $col++;
        }
        $sheet->getStyle('A' . $row . ':I' . $row)->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '333333']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
        ]);

        // Data rows
        $row++;
        foreach ($devices as $device) {
            $costPrice = $device['cost_price'] ?? 0;
            $msrp = $device['msrp'] ?? $device['retail_price'] ?? 0;
            $markup = $device['markup'] ?? 0;
            $sellingPrice = $device['calculated_selling_price'] ?? $device['selling_price'] ?? 0;
            $profitLoss = $device['profit_loss'] ?? ($sellingPrice - $costPrice);
            $isProfitable = $profitLoss >= 0;

            $sheet->setCellValue('A' . $row, $device['name'] ?? 'N/A');
            $sheet->setCellValue('B' . $row, $device['brand'] ?? 'N/A');
            $sheet->setCellValue('C' . $row, $device['model'] ?? 'N/A');
            $sheet->setCellValue('D' . $row, ucfirst($device['category'] ?? 'N/A'));
            $sheet->setCellValue('E' . $row, '₦' . number_format($costPrice, 2));
            $sheet->setCellValue('F' . $row, '₦' . number_format($msrp, 2));
            $sheet->setCellValue('G' . $row, number_format($markup, 1) . '%');
            $sheet->setCellValue('H' . $row, '₦' . number_format($sellingPrice, 2));
            $sheet->setCellValue('I' . $row, '₦' . number_format($profitLoss, 2));

            // Color code profit/loss
            $profitLossColor = $isProfitable ? '4CAF50' : 'f44336';
            $sheet->getStyle('I' . $row)->getFont()->getColor()->setRGB($profitLossColor);

            $row++;
        }

        // Auto-size columns
        foreach (range('A', 'I') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Generate and download
        $writer = new Xlsx($spreadsheet);
        $filename = 'device-report-' . date('Y-m-d') . '.xlsx';
        $tempFile = tempnam(sys_get_temp_dir(), 'device_report');
        $writer->save($tempFile);

        return response()->download($tempFile, $filename)->deleteFileAfterSend(true);
    }
}
