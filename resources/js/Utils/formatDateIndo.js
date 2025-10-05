export default function formatDateIndo(dateString) {
    if (!dateString) return "-";
    const date = new Date(dateString);

    return date.toLocaleString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}
