<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Attendance List - {{ $event->name }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #333;
            margin-bottom: 10px;
        }
        .header p {
            color: #666;
            margin: 5px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #f5f5f5;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Perserta</h1>
        <p><strong>Event:</strong> {{ $event->name }}</p>
        <p><strong>Tanggal:</strong> {{ \Carbon\Carbon::parse($event->event_date_start)->format('d F Y') }}</p>
        <p><strong>Lokasi:</strong> {{ $event->location }}</p>
        <p><strong>Total Peserta:</strong> {{ $attendees->count() }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>No</th>
                <th>Nama</th>
                <th>Email</th>
                <th>Jumlah Tiket</th>
                <th>Tiket Detail</th>
            </tr>
        </thead>
        <tbody>
            @foreach($attendees as $index => $attendee)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ $attendee['user_name'] }}</td>
                <td>{{ $attendee['user_email'] }}</td>
                <td>{{ $attendee['tickets_purchased'] }}</td>
                <td>{{ $attendee['ticket_details'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p>Dibuat pada {{ \Carbon\Carbon::now()->format('d F Y H:i:s') }}</p>
    </div>
</body>
</html>