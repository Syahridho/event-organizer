<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EventRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
         return [
            'name' => ['required', 'string'],
            'description' => ['nullable', 'string'],
            'thumbnail' => ['nullable'],
            'event_mode' => ['required', 'string', 'in:Offline,Google Meet,Zoom'],
            'link_meeting' => ['nullable', 'string'],
            'event_date_start' => ['required', 'date'],
            'event_date_end' => ['nullable', 'date', 'after_or_equal:event_date_start'],
            'location' => ['nullable', 'string'],
            'pin' => ['nullable', 'array'],

            'ticket_date_start' => ['nullable', 'date'],
            'ticket_date_end' => ['nullable', 'date'],

            'speakers' => ['array'],
            'speakers.*.name' => ['required', 'string'],
            'speakers.*.photo' => ['required', 'file', 'image'],
            'speakers.*.description' => ['required', 'string'],

            'tickets' => ['array'],
            'tickets.*.name' => ['required', 'string'],
            'tickets.*.price' => ['required', 'numeric'],
            'tickets.*.quota' => ['required', 'integer'],
        ];
    }
}
