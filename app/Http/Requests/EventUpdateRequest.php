<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EventUpdateRequest extends FormRequest
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
            'name' => [ 'string'],
            'description' => ['nullable', 'string'],
            'thumbnail' => ['nullable'],
            'event_mode' => ['string', 'in:Offline,Google Meet,Zoom'],
            'link_meeting' => ['nullable', 'string'],
            'event_date_start' => ['date'],
            'event_date_end' => ['nullable', 'date', 'after_or_equal:event_date_start'],
            'location' => ['nullable', 'string'],
            'pin' => ['nullable', 'array'],

            'ticket_date_start' => ['nullable', 'date'],
            'ticket_date_end' => ['nullable', 'date'],

            'speakers' => ['array'],
            'speakers.*.id' => ['nullable', 'integer'],
            'speakers.*.photo' => ['nullable'],
            'speakers.*.name' => ['string'],
            'speakers.*.description' => ['nullable', 'string'],


            'tickets' => ['array'],
            'tickets.*.id' => ['nullable', 'integer', 'exists:tickets,id'],
            'tickets.*.name' => ['string'],
            'tickets.*.price' => ['numeric'],
            'tickets.*.quota' => ['integer'],

            'selected_categories' => ['nullable', 'array'],
            'selected_categories.*.id' => ['required', 'integer', 'exists:categories,id'],
            'selected_categories.*.name' => ['required', 'string'],
        ];
    }
}
