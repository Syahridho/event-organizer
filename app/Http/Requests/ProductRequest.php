<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProductRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'price' => ['required', 'numeric', 'min:0'],
            'status' => ['required', 'string', 'in:active,inactive'],
            'category_ids' => ['array'],
            'category_ids.*' => ['required', 'integer', 'exists:categories,id'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array
     */
    public function messages(): array
    {
        return [
            'category_ids.*.exists' => 'The selected category is invalid.',
            'category_ids.required' => 'Please select at least one category.',
            'price.min' => 'Price must be at least 0.',
            'status.in' => 'Status must be either active or inactive.',
        ];
    }
}