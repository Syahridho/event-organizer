<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public $otp;
    public $email;

    /**
     * Create a new message instance.
     *
     * @param string $otp
     * @param string $email
     * @return void
     */
    public function __construct($otp, $email = null)
    {
        $this->otp = $otp;
        $this->email = $email;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->subject('Kode OTP Anda')
            ->view('emails.otp')
            ->with([
                'otp' => $this->otp,
                'email' => $this->email
            ]);
    }
}