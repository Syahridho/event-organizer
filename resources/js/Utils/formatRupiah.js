export const formatRupiah = (value) => {
    const safeValue =
        typeof value === "number"
            ? value
            : parseFloat(String(value ?? "0").replace(",", "."));

    if (isNaN(safeValue)) return "0";

    const formatted = new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(safeValue);

    return formatted.replace(/,0+$/, "");
};

export const formatRupiahInput = (input) => {
    const numeric =
        typeof input === "number"
            ? input
            : parseInt(String(input).replace(/\./g, ""), 10);

    return new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(numeric || 0);
};

export default formatRupiah;
