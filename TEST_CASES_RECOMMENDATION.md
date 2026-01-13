# Rekomendasi Test Cases untuk Event Organizers

Berdasarkan analisis kodebase, berikut adalah daftar test cases yang perlu diimplementasikan untuk memastikan kualitas dan keamanan aplikasi.

## 1. Authentication & Authorization

### 1.1 AuthenticationTest (sudah ada)

-   [x] test_login_screen_can_be_rendered
-   [x] test_users_can_authenticate_using_the_login_screen
-   [x] test_users_can_not_authenticate_with_invalid_password

### 1.2 Test Tambahan

-   [ ] test_registration_flow (nama, email, password, confirm password)
-   [ ] test_email_verification_required
-   [ ] test_password_reset_flow
-   [ ] test_user_cannot_access_protected_routes_when_unauthenticated
-   [ ] test_role_based_access (admin, mitra, member)
-   [ ] test_banned_user_cannot_login
-   [ ] test_oauth_social_login (jika ada)

## 2. Profile Management

### 2.1 ProfileTest (sudah ada)

-   [x] test_profile_page_is_displayed
-   [x] test_profile_information_can_be_updated
-   [x] test_email_verification_status_is_unchanged_when_the_email_address_is_unchanged
-   [x] test_user_can_delete_their_account
-   [x] test_correct_password_must_be_provided_to_delete_account

### 2.2 Test Tambahan

-   [ ] test_profile_photo_upload (valid file types, size)
-   [ ] test_profile_photo_deletion
-   [ ] test_profile_update_validation (required fields, unique email)
-   [ ] test_user_cannot_update_other_user_profile
-   [ ] test_wallet_info_displayed_on_profile (balance, transactions)

## 3. Event CRUD (Mitra)

### 3.1 Create Event

-   [ ] test_mitra_can_create_event_with_valid_data
-   [ ] test_creation_fails_without_required_fields
-   [ ] test_thumbnail_upload_works
-   [ ] test_speakers_and_tickets_created_with_event
-   [ ] test_default_free_ticket_if_no_tickets_provided
-   [ ] test_event_date_validation (start before end, etc.)

### 3.2 Read Event

-   [ ] test_event_index_shows_only_own_events_for_mitra
-   [ ] test_event_show_returns_correct_data
-   [ ] test_event_show_includes_tax_calculation
-   [ ] test_event_status_calculation (upcoming, ongoing, completed)

### 3.3 Update Event

-   [ ] test_mitra_can_update_own_event
-   [ ] test_update_fails_if_event_has_settled_transactions
-   [ ] test_thumbnail_update_and_old_file_deleted
-   [ ] test_speaker_update_add_delete
-   [ ] test_ticket_update_with_quota_validation
-   [ ] test_update_fails_if_quota_less_than_sold

### 3.4 Delete Event

-   [ ] test_mitra_can_delete_own_event
-   [ ] test_delete_fails_if_event_has_settled_transactions
-   [ ] test_associated_speakers_tickets_photos_deleted
-   [ ] test_thumbnail_file_deleted_from_storage

## 4. Building CRUD (Mitra)

### 4.1 Create Building

-   [ ] test_mitra_can_create_building_with_valid_data
-   [ ] test_thumbnail_and_item_photos_upload
-   [ ] test_price_parsing (remove dots)

### 4.2 Read Building

-   [ ] test_building_index_shows_only_own_buildings
-   [ ] test_building_show_includes_tax_calculation

### 4.3 Update Building

-   [ ] test_mitra_can_update_own_building
-   [ ] test_thumbnail_update_deletes_old_file
-   [ ] test_item_photos_add_delete
-   [ ] test_update_fails_if_has_settled_transactions

### 4.4 Delete Building

-   [ ] test_mitra_can_delete_own_building
-   [ ] test_delete_fails_if_has_settled_transactions
-   [ ] test_associated_photos_deleted_from_storage

## 5. Wallet & Transactions

### 5.1 WalletRefundTest (sudah ada)

-   [x] test_partner_cancellation_refunds_user_wallet_and_logs_history_idempotently

### 5.2 Test Tambahan

-   [ ] test_wallet_auto_creation_on_first_access
-   [ ] test_wallet_balance_cannot_be_negative
-   [ ] test_wallet_transaction_history_pagination
-   [ ] test_credit_debit_operations
-   [ ] test_pending_withdraw_affects_available_balance
-   [ ] test_wallet_transaction_rollback_on_failure

## 6. Withdraw Request & Admin Approval

### 6.1 User Withdraw Request

-   [ ] test_user_can_request_withdraw_with_valid_data
-   [ ] test_withdraw_amount_cannot_exceed_available_balance
-   [ ] test_withdraw_validation (method, account details)
-   [ ] test_withdraw_status_defaults_to_pending

### 6.2 Admin Withdraw Management

-   [ ] test_admin_can_view_withdraw_requests_filtered_by_status
-   [ ] test_admin_can_approve_withdraw_with_proof_upload
-   [ ] test_approval_deducts_wallet_balance_and_logs_transaction
-   [ ] test_admin_can_reject_withdraw (no balance deduction)
-   [ ] test_idempotency_approve_reject (no double processing)
-   [ ] test_notification_sent_to_user_on_status_change

## 7. Report System

### 7.1 Create Report

-   [ ] test_user_can_report_event_service_building_property
-   [ ] test_report_requires_reason_and_valid_reportable
-   [ ] test_spam_protection_prevents_duplicate_report
-   [ ] test_report_associated_with_authenticated_user

## 8. Admin Operations

### 8.1 Event Management (Admin)

-   [ ] test_admin_can_view_all_events
-   [ ] test_admin_can_ban_event (status changed to banned)
-   [ ] test_banned_event_not_visible_to_public

### 8.2 User Management

-   [ ] test_admin_can_view_all_users
-   [ ] test_admin_can_ban_user
-   [ ] test_banned_user_cannot_login
-   [ ] test_admin_can_update_user_role

### 8.3 Withdraw Management (lihat di atas)

## 9. Chat & Notifications

### 9.1 Chat System

-   [ ] test_user_can_send_message_to_other_user
-   [ ] test_user_can_view_conversation
-   [ ] test_message_read_status
-   [ ] test_unauthorized_user_cannot_access_others_chat

### 9.2 Notifications

-   [ ] test_notification_created_on_event_purchase
-   [ ] test_notification_created_on_withdraw_status_change
-   [ ] test_user_can_mark_notification_as_read
-   [ ] test_notifications_only_for_authenticated_user

## 10. Tax Helper (Unit Test)

### 10.1 TaxHelper

-   [ ] test_calculate_final_price_with_tax
-   [ ] test_get_tax_info_returns_correct_rate
-   [ ] test_edge_cases (zero price, negative price)

## 11. Cart & Checkout

### 11.1 Cart Operations

-   [ ] test_add_item_to_cart (event ticket, service, building)
-   [ ] test_update_cart_item_quantity
-   [ ] test_remove_item_from_cart
-   [ ] test_cart_total_calculation_includes_tax

### 11.2 Checkout Process

-   [ ] test_checkout_creates_transaction
-   [ ] test_midtrans_integration_mock
-   [ ] test_free_event_registration_flow
-   [ ] test_transaction_status_flow (pending, settlement, expired)

## 12. API Endpoints (JSON responses)

### 12.1 Event Free Registration API

-   [ ] test_api_returns_success_for_free_registration
-   [ ] test_api_prevents_duplicate_registration
-   [ ] test_api_validation_errors

### 12.2 Other APIs

-   [ ] test_chat_api
-   [ ] test_notification_api
-   [ ] test_wallet_balance_api

## Prioritas Implementasi

1. **High Priority** (Critical Business Logic)

    - Authentication & Authorization
    - Event CRUD dengan validasi transaksi
    - Withdraw approval flow
    - Wallet balance integrity

2. **Medium Priority** (Important Features)

    - Building CRUD
    - Report system
    - Profile & photo management
    - Admin operations

3. **Low Priority** (Nice to Have)
    - Chat & notifications
    - Tax helper unit tests
    - Cart & checkout (jika belum ada test)

## Catatan Teknis

-   Gunakan `RefreshDatabase` untuk test database.
-   Mock external services (Midtrans, storage upload) untuk mempercepat test.
-   Gunakan factory untuk membuat data test.
-   Pastikan setiap test menguji satu skenario spesifik.
-   Cover positive dan negative cases.
-   Integrasi dengan CI/CD (GitHub Actions) untuk menjalankan test suite.

## Struktur File Test yang Direkomendasikan

```
tests/Feature/
├── Auth/
│   ├── AuthenticationTest.php (existing)
│   ├── RegistrationTest.php (existing)
│   └── RoleAccessTest.php (new)
├── Event/
│   ├── EventCrudTest.php
│   └── EventTransactionValidationTest.php
├── Building/
│   └── BuildingCrudTest.php
├── Profile/
│   ├── ProfileTest.php (existing)
│   └── ProfilePhotoTest.php (new)
├── Wallet/
│   ├── WalletRefundTest.php (existing)
│   ├── WalletBalanceTest.php (new)
│   └── WithdrawTest.php (new)
├── Admin/
│   ├── AdminEventTest.php
│   └── AdminUserTest.php
├── Report/
│   └── ReportTest.php
└── Api/
    └── EventFreeApiTest.php
```

## Langkah Selanjutnya

1. Pilih area prioritas tinggi untuk mulai diimplementasikan.
2. Buat factory untuk model yang belum ada (jika diperlukan).
3. Implementasikan test case per area.
4. Jalankan test suite dan perbaiki bug yang ditemukan.
5. Integrasikan dengan pipeline CI/CD.

Dengan test cases di atas, Anda dapat mencapai cakupan pengujian yang baik untuk aplikasi Event Organizers.
