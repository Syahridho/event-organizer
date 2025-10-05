export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validatePhone = (phone) => {
    const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
    return phoneRegex.test(phone);
};

export const validatePostalCode = (postalCode) => {
    const postalRegex = /^[0-9]{5}$/;
    return postalRegex.test(postalCode);
};

export const validateRequired = (value) => {
    return value && value.toString().trim().length > 0;
};
