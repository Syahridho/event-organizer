import { format } from "date-fns";
import { id } from "date-fns/locale";

export function combineDateAndTimeToSQL(date, time) {
    const [hours, minutes] = time.split(":");
    date.setHours(Number(hours));
    date.setMinutes(Number(minutes));
    date.setSeconds(0);

    // Format ke lokal, bukan UTC
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    const ss = "00";

    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

export function formatTanggalIndo(dateString) {
    try {
        const parsedDate = new Date(dateString);
        return format(parsedDate, "d MMMM yyyy", { locale: id });
    } catch (e) {
        return "Tanggal tidak valid";
    }
}

export function getJamMenit(datetimeString) {
    const date = new Date(datetimeString);
    const jam = String(date.getHours()).padStart(2, "0");
    const menit = String(date.getMinutes()).padStart(2, "0");
    return `${jam}:${menit}`;
}

export function getDayName(dateTimeString, locale = "id-ID") {
    const date = new Date(dateTimeString.replace(" ", "T"));
    return date.toLocaleDateString(locale, { weekday: "long" });
}

export function formatToWIB(date) {
    if (!date) return null;

    return new Date(date).toLocaleString("sv-SE", {
        timeZone: "Asia/Jakarta",
        hour12: false,
    });
}
