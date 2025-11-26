// Database schema in DBML

Enum user_role {
admin
mitra
member
}

Enum common_status {
active
inactive
banned
completed
}

Enum withdraw_status {
pending
completed
rejected
cancelled
}

Enum mitra_status {
pending
approved
rejected
}

Enum tax_type {
percent
fixed
}

Table users {
id bigint [pk, increment]
uuid uuid [unique]
name varchar(255)
username varchar(255) [unique]
email varchar(255) [unique]
profile_photo varchar(255) [null]
email_verified_at timestamp [null]
password varchar(255)
role user_role [default: 'member']
last_seen_at timestamp [null]
remember_token varchar(100) [null]
created_at timestamp
updated_at timestamp
}

Table password_reset_tokens {
email varchar(255) [pk]
token varchar(255)
created_at timestamp [null]
}

Table failed_jobs {
id bigint [pk, increment]
uuid varchar(255) [unique]
connection text
queue text
payload longtext
exception longtext
failed_at timestamp [default: `CURRENT_TIMESTAMP`]
}

Table personal_access_tokens {
id bigint [pk, increment]
tokenable_type varchar(255)
tokenable_id bigint
name varchar(255)
token varchar(64) [unique]
abilities text [null]
last_used_at timestamp [null]
expires_at timestamp [null]
created_at timestamp
updated_at timestamp

indexes {
(tokenable_type, tokenable_id)
}
}

Table chats {
id bigint [pk, increment]
sender_id bigint
receiver_id bigint
reply_id bigint [null]
message text
seen_at timestamp [null]
message_deleted_at timestamp [null]
created_at timestamp
updated_at timestamp
}

Table otp_tokens {
id bigint [pk, increment]
email varchar(255)
otp varchar(255) [null]
expires_at timestamp [null]
created_at timestamp
updated_at timestamp
}

Table events {
id bigint [pk, increment]
user_id bigint
name varchar(255)
description text [null]
event_mode varchar(32) [note: 'enum: Offline | Google Meet | Zoom']
location varchar(255) [null]
pin varchar(255) [null]
link_meeting varchar(255) [null]
thumbnail varchar(255) [null]
event_date_start datetime
event_date_end datetime
ticket_date_start datetime
ticket_date_end datetime
status common_status [default: 'active']
created_at timestamp
updated_at timestamp
}

Table speakers {
id bigint [pk, increment]
event_id bigint
name varchar(255)
photo varchar(255)
description varchar(255)
created_at timestamp
updated_at timestamp
}

Table tickets {
id bigint [pk, increment]
event_id bigint
name varchar(255)
price int
quota int
created_at timestamp
updated_at timestamp
}

Table services {
id bigint [pk, increment]
user_id bigint
name varchar(255)
thumbnail varchar(255) [null]
description text [null]
location varchar(255) [null]
price int [default: 0]
status common_status [default: 'active']
created_at timestamp
updated_at timestamp
}

Table buildings {
id bigint [pk, increment]
user_id bigint
name varchar(255)
location varchar(255) [null]
description text [null]
thumbnail varchar(255) [null]
pin varchar(255) [null]
capacity varchar(255) [null]
price int [default: 0]
status common_status [default: 'active']
created_at timestamp
updated_at timestamp
}

Table rent_properties {
id bigint [pk, increment]
user_id bigint
name varchar(255)
location varchar(255)
description text [null]
price int [default: 0]
pin varchar(255) [null]
thumbnail varchar(255) [null]
status common_status [default: 'active']
created_at timestamp
updated_at timestamp
}

Table item_photos {
id bigint [pk, increment]
item_id bigint
item_type varchar(255)
photo varchar(255)
caption varchar(255) [null]
created_at timestamp
updated_at timestamp
}

Table carts {
id bigint [pk, increment]
user_id bigint
item_id bigint
item_type varchar(255)
rent_days date [null]
type varchar(255)
is_unavailable varchar(255) [default: 'available']
item_qty int [default: 1]
created_at timestamp
updated_at timestamp
}

Table transactions {
id bigint [pk, increment]
user_id bigint
order_id varchar(255) [unique]
redirect_url varchar(255)
status varchar(255) [default: 'pending']
token varchar(255)
total decimal(15,2) [default: 0]
expired_at datetime [null]
payment_type varchar(255) [null]
discount varchar(255) [null]
tax varchar(255) [null]
va_number varchar(255) [null]
bank_name varchar(255) [null]
bill_key varchar(255) [null]
biller_code varchar(255) [null]
created_at timestamp
updated_at timestamp

indexes {
user_id
status
va_number
}
}

Table reviews {
id bigint [pk, increment]
user_id bigint
item_id bigint
item_type varchar(255)
rating int
comment text [null]
created_at timestamp
updated_at timestamp

indexes {
(item_type, item_id, created_at) [name: 'reviews_item_index']
(user_id, item_id, item_type) [unique, name: 'reviews_user_item_unique']
}
}

Table transaction_items {
id bigint [pk, increment]
transaction_id bigint
item_id bigint [note: "Polymorphic target id (tickets|services|buildings|rent_properties). See conditional Refs based on item_type"]
item_type varchar(255) [note: "FQCN e.g., App\\Models\\Ticket|Service|Building|RentProperty"]
type varchar(255)
qty int [default: 1]
price int
rent_days date [null]
note text [null]
reviews_id bigint [null]
note_admin text [null]
status varchar(255) [default: 'pending']
created_at timestamp
updated_at timestamp

indexes {
transaction_id
reviews_id
item_id
(item_id, rent_days)
}
}

Table transaction_addresses {
id bigint [pk, increment]
transaction_id bigint
user_id bigint
recipient_name varchar(255)
phone varchar(20)
address_line text
city varchar(255) [null]
province varchar(255) [null]
postal_code varchar(10) [null]
note text [null]
created_at timestamp
updated_at timestamp

indexes {
transaction_id
user_id
}
}

Table addresses {
id bigint [pk, increment]
user_id bigint
label varchar(255) [null]
recipient_name varchar(255)
phone varchar(20)
address_line text
city varchar(255) [null]
province varchar(255) [null]
district varchar(255) [null]
postal_code varchar(10) [null]
note text [null]
is_default boolean [default: false]
created_at timestamp
updated_at timestamp
}

Table admin_settings {
id bigint [pk, increment]
site_name varchar(255) [default: 'Event Organizer']
logo varchar(255) [null]
currency varchar(10) [default: 'IDR']
payment_time int [default: 60]
tax_type tax_type [default: 'percent']
tax_value decimal(10,2) [default: 0]
contact_email varchar(255) [null]
contact_phone varchar(255) [null]
address text [null]
about_us text [null]
created_at timestamp
updated_at timestamp
}

Table leaves {
id bigint [pk, increment]
user_id bigint
item_id bigint
item_type varchar(255)
date date [null]
day_of_week varchar(255) [null]
created_at timestamp
updated_at timestamp
}

Table notifications {
id uuid [pk]
type varchar(255)
notifiable_type varchar(255)
notifiable_id bigint
data text
read_at timestamp [null]
created_at timestamp
updated_at timestamp

indexes {
(notifiable_type, notifiable_id)
}
}

Table wallets {
id bigint [pk, increment]
user_id bigint
balance decimal(15,2) [default: 0]
created_at timestamp
updated_at timestamp

indexes {
(user_id) [unique]
}
}

Table withdraws {
id bigint [pk, increment]
user_id bigint
amount decimal(10,2)
method varchar(255)
account_holder_name varchar(255)
account_number varchar(255)
proof varchar(255) [null]
other_method varchar(255) [null]
status withdraw_status [default: 'pending']
created_at timestamp
updated_at timestamp
}

Table mitra {
id bigint [pk, increment]
user_id bigint
address text
npwp_number varchar(20)
npwp_file_path varchar(255)
business_file_path varchar(255)
description text
status mitra_status [default: 'pending']
is_verified boolean [default: false]
created_at timestamp
updated_at timestamp
}

Ref: chats.sender_id > users.id [delete: cascade]
Ref: chats.receiver_id > users.id [delete: cascade]
Ref: chats.reply_id > chats.id [delete: cascade]

Ref: otp_tokens.email > users.email [delete: cascade]

Ref: events.user_id > users.id [delete: cascade]
Ref: speakers.event_id > events.id [delete: cascade]
Ref: tickets.event_id > events.id [delete: cascade]

Ref: services.user_id > users.id [delete: cascade]
Ref: buildings.user_id > users.id [delete: cascade]
Ref: rent_properties.user_id > users.id [delete: cascade]

Ref: carts.user_id > users.id [delete: cascade]

Ref: transactions.user_id > users.id [delete: cascade]

Ref: reviews.user_id > users.id [delete: cascade]

Ref: transaction_items.transaction_id > transactions.id [delete: cascade]
Ref: transaction_items.reviews_id > reviews.id [delete: cascade]

Ref: transaction_addresses.transaction_id > transactions.id [delete: cascade]
Ref: transaction_addresses.user_id > users.id [delete: cascade]

Ref: addresses.user_id > users.id [delete: cascade]

Ref: wallets.user_id > users.id [delete: cascade]

Ref: withdraws.user_id > users.id [delete: cascade]

Ref: mitra.user_id > users.id [delete: cascade]

// Polymorphic References for transaction_items.item_id conditioned by item_type
// Polymorphic: only when item_type = 'App\\Models\\Ticket'\nRef: transaction_items.item_id > tickets.id
// Polymorphic: only when item_type = 'App\\Models\\Service'\nRef: transaction_items.item_id > services.id
// Polymorphic: only when item_type = 'App\\Models\\Building'\nRef: transaction_items.item_id > buildings.id
// Polymorphic: only when item_type = 'App\\Models\\RentProperties'\nRef: transaction_items.item_id > rent_properties.id

// Polymorphic References for carts.item_id conditioned by item_type
// Polymorphic: only when item_type = 'App\Models\Ticket'
Ref: carts.item_id > tickets.id
// Polymorphic: only when item_type = 'App\Models\Service'
Ref: carts.item_id > services.id
// Polymorphic: only when item_type = 'App\Models\Building'
Ref: carts.item_id > buildings.id
// Polymorphic: only when item_type = 'App\Models\RentProperties'
Ref: carts.item_id > rent_properties.id

// Polymorphic References for item_photos.item_id conditioned by item_type
// Polymorphic: only when item_type = 'App\Models\Service'
Ref: item_photos.item_id > services.id
// Polymorphic: only when item_type = 'App\Models\Building'
Ref: item_photos.item_id > buildings.id
// Polymorphic: only when item_type = 'App\Models\RentProperties'
Ref: item_photos.item_id > rent_properties.id

// Polymorphic References for reviews.item_id conditioned by item_type
// Polymorphic: only when item_type = 'App\Models\Ticket'
Ref: reviews.item_id > tickets.id
// Polymorphic: only when item_type = 'App\Models\Service'
Ref: reviews.item_id > services.id
// Polymorphic: only when item_type = 'App\Models\Building'
Ref: reviews.item_id > buildings.id
// Polymorphic: only when item_type = 'App\Models\RentProperties'
Ref: reviews.item_id > rent_properties.id

// Polymorphic References for leaves.item_id conditioned by item_type
// Polymorphic: only when item_type = 'App\Models\Ticket'
Ref: leaves.item_id > tickets.id
// Polymorphic: only when item_type = 'App\Models\Service'
Ref: leaves.item_id > services.id
// Polymorphic: only when item_type = 'App\Models\Building'
Ref: leaves.item_id > buildings.id
// Polymorphic: only when item_type = 'App\Models\RentProperties'
Ref: leaves.item_id > rent_properties.id

// Polymorphic References for notifications.notifiable_id conditioned by notifiable_type
// Polymorphic: only when notifiable_type = 'App\Models\User'
Ref: notifications.notifiable_id > users.id

// Polymorphic References for personal_access_tokens.tokenable_id conditioned by tokenable_type
// Polymorphic: only when tokenable_type = 'App\Models\User'
Ref: personal_access_tokens.tokenable_id > users.id
