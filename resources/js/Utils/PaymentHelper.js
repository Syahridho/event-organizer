/**
 * Reusable payment helper for Midtrans integration
 * Sends base prices to backend, tax will be calculated server-side
 */

/**
 * Creates payment payload for Midtrans with base prices only
 * @param {Object} item - The item to purchase (ticket, service, building, rent_property)
 * @param {number} quantity - Quantity of items
 * @param {Object} userInfo - User information for payment
 * @param {Object} shippingAddress - Optional shipping address
 * @returns {Object} Payment payload for Midtrans API (base prices only)
 */
export const createPaymentPayload = (
    item,
    quantity,
    userInfo,
    delivery_type = null,
    note = null,
    shippingAddress = null
) => {
    // Use base price only - tax will be calculated on backend
    const basePrice = item.price;

    const payload = {
        items: [
            {
                id: item.id,
                price: Math.round(basePrice), // Base price only
                name: item.name,
                type: getItemType(item),
                delivery_type: delivery_type,
                note: note,
                quantity: quantity,
                rent_days: item.rent_days || null,
            },
        ],
        amount: Math.round(basePrice * quantity), // Subtotal only (base prices)
        name: userInfo.name,
        email: userInfo.email,
    };

    // Add shipping address if provided
    if (shippingAddress) {
        payload.shipping_address = shippingAddress;
    }

    return payload;
};

/**
 * Determines item type based on item property or URL
 * @param {Object} item - The item object
 * @returns {string} Item type for Midtrans
 */
const getItemType = (item) => {
    // 1) Explicit type takes precedence
    if (item?.type) {
        return item.type;
    }

    // 2) Infer from FQCN if available (e.g., from cart/detail contexts)
    if (item?.item_type) {
        switch (item.item_type) {
            case "App\\Models\\Ticket":
                return "ticket";
            case "App\\Models\\Service":
                return "service";
            case "App\\Models\\Building":
                return "building";
            case "App\\Models\\RentProperty":
                return "rent_property";
            default:
                break;
        }
    }

    // 3) Determine type based on URL path (ensure property -> rent_property)
    const pathname = window.location.pathname || "";

    if (pathname.includes("/events/") || pathname.includes("/event/")) {
        return "ticket";
    }
    if (pathname.includes("/services/") || pathname.includes("/service/")) {
        return "service";
    }
    if (pathname.includes("/buildings/") || pathname.includes("/building/")) {
        return "building";
    }
    // Important: map property pages to rent_property
    if (pathname.includes("/propertys/") || pathname.includes("/property/")) {
        return "rent_property";
    }
    if (pathname.includes("/rents/") || pathname.includes("/rent/")) {
        return "rent_property";
    }

    // 4) Heuristic fallback by item fields
    if (item && typeof item === "object") {
        if ("quota" in item) return "ticket";
        if ("location" in item && "pin" in item) return "building";
        if ("location" in item && !("quota" in item)) return "rent_property";
    }

    // Default fallback
    return "service";
};

/**
 * Formats price display with tax information
 * @param {number} basePrice - Original price
 * @param {number} finalPrice - Tax-inclusive price
 * @param {Object} taxInfo - Tax information from backend
 * @returns {Object} Formatted price information
 */
export const formatPriceWithTax = (basePrice, finalPrice, taxInfo) => {
    const taxAmount = finalPrice - basePrice;

    return {
        basePrice,
        finalPrice,
        taxAmount,
        taxInfo,
        formatted: {
            basePrice: formatCurrency(basePrice),
            finalPrice: formatCurrency(finalPrice),
            taxAmount: formatCurrency(taxAmount),
            taxLabel: taxInfo?.label || "Pajak",
        },
    };
};

/**
 * Formats currency to Indonesian Rupiah
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

/**
 * Validates payment payload before submission
 * @param {Object} payload - Payment payload to validate
 * @returns {Object} Validation result
 */
export const validatePaymentPayload = (payload) => {
    const errors = [];

    // Check required fields
    if (!payload.items || payload.items.length === 0) {
        errors.push("Items are required");
    }

    if (!payload.amount || payload.amount < 1000) {
        errors.push("Amount must be at least 1000");
    }

    if (!payload.name || payload.name.trim() === "") {
        errors.push("Name is required");
    }

    if (!payload.email || !isValidEmail(payload.email)) {
        errors.push("Valid email is required");
    }

    // Validate each item
    payload.items?.forEach((item, index) => {
        if (!item.id || item.id <= 0) {
            errors.push(`Item ${index + 1}: Valid ID is required`);
        }

        if (!item.price || item.price < 100) {
            errors.push(`Item ${index + 1}: Price must be at least 100`);
        }

        if (!item.name || item.name.trim() === "") {
            errors.push(`Item ${index + 1}: Name is required`);
        }

        if (
            !item.type ||
            !["ticket", "service", "building", "rent_property"].includes(
                item.type
            )
        ) {
            errors.push(`Item ${index + 1}: Valid type is required`);
        }

        if (!item.quantity || item.quantity < 1 || item.quantity > 999) {
            errors.push(
                `Item ${index + 1}: Quantity must be between 1 and 999`
            );
        }
    });

    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Submits payment to Midtrans API
 * @param {Object} payload - Payment payload
 * @returns {Promise} Promise that resolves with Midtrans response
 */
export const submitPayment = async (payload) => {
    const validation = validatePaymentPayload(payload);

    if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    try {
        const response = await fetch("/midtrans/create-snap-token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute("content"),
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Payment failed");
        }

        return data;
    } catch (error) {
        console.error("Payment submission error:", error);
        throw error;
    }
};

/**
 * Redirects to Midtrans payment page
 * @param {string} redirectUrl - Midtrans redirect URL
 */
export const redirectToPayment = (redirectUrl) => {
    if (redirectUrl) {
        window.location.href = redirectUrl;
    } else {
        throw new Error("Payment redirect URL is required");
    }
};

/**
 * Handles complete payment flow
 * @param {Object} item - Item to purchase
 * @param {number} quantity - Quantity
 * @param {Object} userInfo - User information
 * @param {Object} shippingAddress - Optional shipping address
 * @returns {Promise} Promise that resolves when payment is initiated
 */
export const processPayment = async (
    item,
    quantity,
    userInfo,
    shippingAddress = null
) => {
    try {
        // Create payment payload with pre-calculated tax-inclusive price
        const payload = createPaymentPayload(
            item,
            quantity,
            userInfo,
            shippingAddress
        );

        // Submit to Midtrans
        const response = await submitPayment(payload);

        // Redirect to payment page
        if (response.success && response.redirect_url) {
            redirectToPayment(response.redirect_url);
        } else {
            throw new Error(response.error || "Payment initialization failed");
        }

        return response;
    } catch (error) {
        console.error("Payment processing error:", error);
        throw error;
    }
};
