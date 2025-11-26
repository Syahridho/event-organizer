<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kode OTP Anda</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #4a6cf7;
        }
        .otp-code {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            padding: 25px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
            position: relative;
            overflow: hidden;
        }
        .otp-code::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
            pointer-events: none;
        }
        .otp-number {
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #ffffff;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
            position: relative;
            z-index: 1;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 14px;
            color: #6c757d;
        }
        .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 10px 15px;
            margin: 20px 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Event Organizer</div>
            <h2>Verifikasi Email Anda</h2>
        </div>
        
        <p>Halo,</p>
        <p>Terima kasih telah mendaftar di Event Organizer. Untuk melanjutkan, silakan masukkan kode OTP berikut:</p>
        
        <div class="otp-code">
            <div class="otp-number">{{ $otp }}</div>
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
            <p style="font-size: 14px; color: #6c757d; margin: 0;">Atau klik tombol di bawah untuk verifikasi otomatis:</p>
            <a href="{{ route('otp.verify.page', ['email' => $email ?? '']) }}"
               style="display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 10px;">
                Verifikasi Sekarang
            </a>
        </div>
        
        <div class="warning">
            <strong>⚠️ Penting:</strong>
            <ul style="margin: 10px 0; padding-left: 20px; text-align: left;">
                <li>Kode ini hanya berlaku selama <strong>10 menit</strong></li>
                <li>Jangan bagikan kode ini dengan siapa pun</li>
                <li>Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini</li>
            </ul>
        </div>
        
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 13px; color: #6c757d;">
                <strong>Butuh bantuan?</strong> Hubungi tim support kami di
                <a href="mailto:support@eventorganizer.com" style="color: #4a6cf7; text-decoration: none;">support@eventorganizer.com</a>
            </p>
        </div>
        
        <p>Jika Anda tidak meminta kode ini, silakan abaikan email ini.</p>
        
        <div class="footer">
            <p>&copy; {{ date('Y') }} Event Organizer. All rights reserved.</p>
        </div>
    </div>
</body>
</html>