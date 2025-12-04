<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Proposal - {{ $project->name }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #333;
        }

        .page-break {
            page-break-after: always;
        }

        .cover-page {
            text-align: center;
            padding: 100px 50px;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }

        .company-logo {
            max-width: 250px;
            max-height: 100px;
            margin-bottom: 30px;
        }

        .project-image {
            max-width: 100%;
            max-height: 400px;
            margin: 30px 0;
            border: 2px solid #ddd;
            border-radius: 8px;
        }

        .client-logo {
            max-width: 200px;
            max-height: 80px;
            margin-top: 30px;
        }

        h1 {
            font-size: 32pt;
            color: #2c3e50;
            margin: 20px 0;
            font-weight: bold;
            text-transform: uppercase;
        }

        h2 {
            font-size: 20pt;
            color: #34495e;
            margin: 25px 0 15px 0;
            font-weight: bold;
            border-bottom: 3px solid #3498db;
            padding-bottom: 8px;
        }

        h3 {
            font-size: 14pt;
            color: #2c3e50;
            margin: 20px 0 10px 0;
            font-weight: bold;
        }

        h4 {
            font-size: 12pt;
            color: #34495e;
            margin: 15px 0 8px 0;
            font-weight: bold;
        }

        .subtitle {
            font-size: 18pt;
            color: #7f8c8d;
            margin: 10px 0 30px 0;
        }

        .content-page {
            padding: 40px 50px;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #3498db;
            padding-bottom: 15px;
        }

        .header-logo {
            max-width: 150px;
            max-height: 60px;
        }

        .header-info {
            text-align: right;
            font-size: 9pt;
            color: #7f8c8d;
        }

        .info-section {
            background: #f8f9fa;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #3498db;
            border-radius: 4px;
        }

        .info-row {
            display: flex;
            margin: 8px 0;
        }

        .info-label {
            font-weight: bold;
            min-width: 180px;
            color: #2c3e50;
        }

        .info-value {
            color: #555;
            flex: 1;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
        }

        thead {
            background: #3498db;
            color: white;
        }

        th {
            padding: 12px;
            text-align: left;
            font-weight: bold;
            font-size: 10pt;
        }

        td {
            padding: 10px 12px;
            border-bottom: 1px solid #e0e0e0;
            font-size: 10pt;
        }

        tbody tr:nth-child(even) {
            background: #f8f9fa;
        }

        tbody tr:hover {
            background: #e8f4f8;
        }

        .device-image {
            max-width: 80px;
            max-height: 80px;
            border-radius: 4px;
            border: 1px solid #ddd;
        }

        .category-section {
            margin: 30px 0;
            page-break-inside: avoid;
        }

        .category-header {
            background: #34495e;
            color: white;
            padding: 12px 20px;
            font-size: 13pt;
            font-weight: bold;
            text-transform: uppercase;
            border-radius: 4px 4px 0 0;
        }

        .location-section {
            margin: 25px 0;
            border: 1px solid #ddd;
            border-radius: 4px;
            overflow: hidden;
        }

        .location-header {
            background: #ecf0f1;
            padding: 12px 20px;
            font-weight: bold;
            color: #2c3e50;
            border-bottom: 2px solid #bdc3c7;
        }

        .cost-summary {
            background: #fff;
            border: 2px solid #3498db;
            border-radius: 8px;
            padding: 25px;
            margin: 30px 0;
        }

        .cost-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #ecf0f1;
            font-size: 11pt;
        }

        .cost-row.subtotal {
            font-weight: bold;
            border-top: 2px solid #34495e;
            margin-top: 10px;
            padding-top: 15px;
        }

        .cost-row.total {
            font-size: 14pt;
            font-weight: bold;
            color: #2c3e50;
            border-top: 3px solid #3498db;
            margin-top: 10px;
            padding-top: 15px;
        }

        .payment-schedule {
            background: #fff3cd;
            border: 2px solid #ffc107;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }

        .payment-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            font-size: 11pt;
        }

        .signature-section {
            margin-top: 80px;
            padding-top: 30px;
        }

        .signature-box {
            border-top: 2px solid #333;
            padding-top: 10px;
            margin-top: 60px;
            display: inline-block;
            min-width: 300px;
        }

        .signature-label {
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
        }

        .signature-name {
            color: #555;
            margin-top: 5px;
        }

        .signature-date {
            color: #7f8c8d;
            font-size: 9pt;
            margin-top: 5px;
        }

        .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
        }

        .footer {
            position: fixed;
            bottom: 20px;
            left: 50px;
            right: 50px;
            text-align: center;
            font-size: 8pt;
            color: #7f8c8d;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        .bold {
            font-weight: bold;
        }

        .highlight {
            background: #fff3cd;
            padding: 15px;
            border-left: 4px solid #ffc107;
            margin: 20px 0;
        }

        .price {
            font-weight: bold;
            color: #27ae60;
        }

        ul {
            margin: 15px 0;
            padding-left: 25px;
        }

        li {
            margin: 8px 0;
            line-height: 1.8;
        }

        .terms-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 4px;
            margin: 20px 0;
            font-size: 10pt;
        }
    </style>
</head>
<body>
    {{-- COVER PAGE --}}
    <div class="cover-page">
        @if($companyLogo)
            <img src="{{ $companyLogo }}" alt="Company Logo" class="company-logo">
        @endif

        <h1>PROJECT PROPOSAL</h1>
        <div class="subtitle">{{ $project->name }}</div>

        @if($projectImage)
            <img src="{{ $projectImage }}" alt="Project Image" class="project-image">
        @endif

        <div style="margin-top: 40px;">
            <div style="font-size: 14pt; color: #555; margin-bottom: 10px;">
                <strong>Prepared For:</strong>
            </div>
            <div style="font-size: 16pt; color: #2c3e50; font-weight: bold;">
                {{ $project->client->name ?? 'N/A' }}
            </div>
        </div>

        @if($clientLogo)
            <img src="{{ $clientLogo }}" alt="Client Logo" class="client-logo">
        @endif

        <div style="margin-top: 40px; color: #7f8c8d;">
            <p>{{ date('F d, Y') }}</p>
            <p>Prepared by: {{ $project->salesperson->name ?? 'N/A' }}</p>
        </div>
    </div>

    <div class="page-break"></div>

    {{-- COMPANY INFORMATION & PROJECT DETAILS --}}
    <div class="content-page">
        <div class="header">
            @if($companyLogo)
                <img src="{{ $companyLogo }}" alt="Company Logo" class="header-logo">
            @endif
            <div class="header-info">
                <div><strong>{{ $settings->company_name ?? 'Hometronix Nigeria Limited' }}</strong></div>
                <div>{{ $settings->company_address ?? '' }}</div>
                <div>{{ $settings->company_phone ?? '' }}</div>
                <div>{{ $settings->company_email ?? '' }}</div>
            </div>
        </div>

        <h2>PROJECT INFORMATION</h2>
        <div class="info-section">
            <div class="info-row">
                <span class="info-label">Project Name:</span>
                <span class="info-value">{{ $project->name }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Client:</span>
                <span class="info-value">{{ $project->client->name ?? 'N/A' }}</span>
            </div>
            @if($project->client && $project->client->email)
            <div class="info-row">
                <span class="info-label">Client Email:</span>
                <span class="info-value">{{ $project->client->email }}</span>
            </div>
            @endif
            @if($project->client && $project->client->phone)
            <div class="info-row">
                <span class="info-label">Client Phone:</span>
                <span class="info-value">{{ $project->client->phone }}</span>
            </div>
            @endif
            <div class="info-row">
                <span class="info-label">Project Manager:</span>
                <span class="info-value">{{ $project->salesperson->name ?? 'N/A' }}</span>
            </div>
            @if($project->start_date)
            <div class="info-row">
                <span class="info-label">Start Date:</span>
                <span class="info-value">{{ $project->start_date->format('F d, Y') }}</span>
            </div>
            @endif
            @if($project->end_date)
            <div class="info-row">
                <span class="info-label">Estimated Completion:</span>
                <span class="info-value">{{ $project->end_date->format('F d, Y') }}</span>
            </div>
            @endif
            <div class="info-row">
                <span class="info-label">Status:</span>
                <span class="info-value">{{ ucfirst($project->status) }}</span>
            </div>
        </div>

        @if($project->description)
        <h2>PROJECT DESCRIPTION</h2>
        <p style="margin: 20px 0; text-align: justify;">{{ $project->description }}</p>
        @endif

        <h2>SCOPE OF WORK</h2>
        <p style="margin: 20px 0; text-align: justify;">
            This comprehensive project proposal outlines the installation and configuration of smart home automation
            systems for the specified property. Our scope includes the supply, installation, and commissioning of
            all equipment and devices as detailed in this document. The project encompasses multiple locations
            within the property, each configured with specific devices to meet your automation needs.
        </p>

        <div class="highlight">
            <strong>Key Deliverables:</strong>
            <ul>
                <li>Complete supply of all specified equipment and devices</li>
                <li>Professional installation and configuration</li>
                <li>System integration and testing</li>
                <li>User training and documentation</li>
                <li>Warranty and post-installation support</li>
            </ul>
        </div>
    </div>

    <div class="page-break"></div>

    {{-- EQUIPMENT DETAILS BY CATEGORY --}}
    <div class="content-page">
        <h2>EQUIPMENT & DEVICE SPECIFICATIONS</h2>
        <p style="margin: 20px 0;">The following sections detail all equipment and devices included in this project, organized by category.</p>

        @foreach($devicesByCategory as $category => $devices)
        <div class="category-section">
            <div class="category-header">
                {{ strtoupper($category) }}
            </div>
            <table>
                <thead>
                    <tr>
                        <th width="15%">Image</th>
                        <th width="30%">Device</th>
                        <th width="25%">Specifications</th>
                        <th width="10%" class="text-center">Qty</th>
                        <th width="10%" class="text-right">Unit Price</th>
                        <th width="10%" class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($devices as $device)
                    <tr>
                        <td class="text-center">
                            @if($device['image_base64'])
                                <img src="{{ $device['image_base64'] }}" alt="{{ $device['name'] }}" class="device-image">
                            @else
                                <div style="width: 80px; height: 80px; background: #ecf0f1; display: flex; align-items: center; justify-content: center; border-radius: 4px; font-size: 8pt; color: #7f8c8d;">No Image</div>
                            @endif
                        </td>
                        <td>
                            <strong>{{ $device['name'] }}</strong><br>
                            <span style="color: #7f8c8d; font-size: 9pt;">
                                {{ $device['brand'] }} {{ $device['model'] }}
                            </span>
                        </td>
                        <td style="font-size: 9pt; color: #555;">
                            {{ $device['specifications'] ?? 'Standard specifications' }}
                        </td>
                        <td class="text-center">{{ $device['quantity'] }}</td>
                        <td class="text-right">{{ $settings->currency ?? '₦' }}{{ number_format($device['unit_price'], 2) }}</td>
                        <td class="text-right price">{{ $settings->currency ?? '₦' }}{{ number_format($device['total_price'], 2) }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        @endforeach
    </div>

    <div class="page-break"></div>

    {{-- COST BREAKDOWN BY LOCATION --}}
    <div class="content-page">
        <h2>COST BREAKDOWN BY LOCATION</h2>
        <p style="margin: 20px 0;">The following section provides a detailed breakdown of costs for each location within the project.</p>

        @foreach($locationCosts as $locationName => $cost)
        <div class="location-section">
            <div class="location-header">
                {{ $locationName }}
            </div>
            <div style="padding: 15px 20px; font-size: 12pt;">
                <div style="display: flex; justify-content: space-between;">
                    <span>Total Cost for this Location:</span>
                    <span class="price">{{ $settings->currency ?? '₦' }}{{ number_format($cost, 2) }}</span>
                </div>
            </div>
        </div>
        @endforeach

        <h2 style="margin-top: 40px;">PROJECT COST SUMMARY</h2>
        <div class="cost-summary">
            <div class="cost-row">
                <span>Equipment & Materials Subtotal:</span>
                <span>{{ $settings->currency ?? '₦' }}{{ number_format($subtotal, 2) }}</span>
            </div>
            <div class="cost-row">
                <span>Professional Services & Installation:</span>
                <span>{{ $settings->currency ?? '₦' }}{{ number_format($professionalFees, 2) }}</span>
            </div>
            <div class="cost-row subtotal">
                <span>Subtotal Before Tax:</span>
                <span>{{ $settings->currency ?? '₦' }}{{ number_format($totalBeforeTax, 2) }}</span>
            </div>
            <div class="cost-row">
                <span>Tax ({{ number_format($taxRate, 2) }}%):</span>
                <span>{{ $settings->currency ?? '₦' }}{{ number_format($tax, 2) }}</span>
            </div>
            <div class="cost-row total">
                <span>GRAND TOTAL:</span>
                <span>{{ $settings->currency ?? '₦' }}{{ number_format($grandTotal, 2) }}</span>
            </div>
        </div>

        <h2>PAYMENT SCHEDULE</h2>
        <div class="payment-schedule">
            <p style="margin-bottom: 15px;"><strong>Payment Terms:</strong></p>
            <div class="payment-item">
                <span>Mobilization Fee ({{ $paymentSchedule['mobilization_percent'] }}%):</span>
                <span class="bold">{{ $settings->currency ?? '₦' }}{{ number_format($paymentSchedule['mobilization_amount'], 2) }}</span>
            </div>
            <div class="payment-item" style="border-top: 1px solid #e0a800; padding-top: 10px; margin-top: 5px;">
                <span>Final Payment upon Completion ({{ $paymentSchedule['final_percent'] }}%):</span>
                <span class="bold">{{ $settings->currency ?? '₦' }}{{ number_format($paymentSchedule['final_amount'], 2) }}</span>
            </div>
        </div>
    </div>

    <div class="page-break"></div>

    {{-- TERMS AND CONDITIONS --}}
    <div class="content-page">
        <h2>TERMS & CONDITIONS</h2>
        @if($settings->contract_terms ?? null)
        <div class="terms-section">
            {!! nl2br(e($settings->contract_terms)) !!}
        </div>
        @else
        <div class="terms-section">
            <p><strong>1. Scope of Work:</strong> The scope of work is limited to the items and services explicitly outlined in this proposal.</p>
            <p><strong>2. Payment Terms:</strong> Payment shall be made according to the schedule outlined above. Mobilization fee is due upon contract signing.</p>
            <p><strong>3. Timeline:</strong> The project timeline is subject to material availability and site readiness.</p>
            <p><strong>4. Warranty:</strong> All equipment carries manufacturer's warranty. Installation workmanship is warranted for one year.</p>
            <p><strong>5. Changes:</strong> Any changes to the scope of work must be agreed upon in writing and may affect the project cost and timeline.</p>
            <p><strong>6. Cancellation:</strong> Cancellation terms will be outlined in the final contract agreement.</p>
        </div>
        @endif

        <div class="highlight" style="margin-top: 30px;">
            <p><strong>Proposal Validity:</strong> This proposal is valid for 30 days from the date of issue.</p>
            <p style="margin-top: 10px;"><strong>Next Steps:</strong> Upon acceptance of this proposal, we will prepare a detailed contract for your review and signature.</p>
        </div>
    </div>

    <div class="page-break"></div>

    {{-- SIGNATURE PAGE --}}
    <div class="content-page">
        <h2>PROPOSAL ACCEPTANCE</h2>
        <p style="margin: 20px 0;">
            By signing below, the parties acknowledge that they have read, understood, and agree to the terms
            and conditions outlined in this project proposal.
        </p>

        <div class="signatures">
            <div style="flex: 1; margin-right: 50px;">
                <div class="signature-label">FOR {{ strtoupper($settings->company_name ?? 'HOMETRONIX NIGERIA LIMITED') }}</div>
                <div class="signature-box">
                    <div class="signature-name">{{ $project->salesperson->name ?? 'N/A' }}</div>
                    <div style="color: #7f8c8d; font-size: 9pt;">Project Manager</div>
                    <div class="signature-date">Date: _____________________</div>
                </div>
            </div>

            <div style="flex: 1; margin-left: 50px;">
                <div class="signature-label">CLIENT ACCEPTANCE</div>
                <div class="signature-box">
                    <div class="signature-name">{{ $project->client->name ?? 'N/A' }}</div>
                    @if($project->client && $project->client->company)
                    <div style="color: #7f8c8d; font-size: 9pt;">{{ $project->client->company }}</div>
                    @endif
                    <div class="signature-date">Date: _____________________</div>
                </div>
            </div>
        </div>

        <div style="margin-top: 80px; padding: 20px; background: #e8f4f8; border-left: 4px solid #3498db; border-radius: 4px;">
            <p style="margin-bottom: 10px;"><strong>Thank you for considering our proposal!</strong></p>
            <p style="font-size: 10pt;">
                Should you have any questions or require clarification on any aspect of this proposal,
                please do not hesitate to contact us.
            </p>
            <div style="margin-top: 15px;">
                <div><strong>{{ $settings->company_name ?? 'Hometronix Nigeria Limited' }}</strong></div>
                <div style="font-size: 9pt; color: #555;">{{ $settings->company_phone ?? '' }}</div>
                <div style="font-size: 9pt; color: #555;">{{ $settings->company_email ?? '' }}</div>
            </div>
        </div>
    </div>

    <div class="footer">
        {{ $settings->company_name ?? 'Hometronix Nigeria Limited' }} | Project Proposal: {{ $project->name }} | Page <span class="pageNumber"></span>
    </div>
</body>
</html>
