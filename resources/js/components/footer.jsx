import { FaWhatsapp } from "react-icons/fa";
import { MdOutlineEmail } from "react-icons/md";
import { FaPhone } from "react-icons/fa6";

import { Link, router, usePage } from "@inertiajs/react";

export default function Footer() {
    const { adminSettings } = usePage().props;

    // Function to format phone number with spaces for better readability
    const formatPhoneNumber = (phone) => {
        // Remove all non-digit characters first
        const cleaned = phone.replace(/\D/g, "");

        // Format Indonesian phone numbers
        if (cleaned.startsWith("62")) {
            // Convert +62xxx to +628 xx xxxx xxxx format
            if (cleaned.length >= 12) {
                return `+62 ${cleaned.substring(2, 4)} ${cleaned.substring(
                    4,
                    8
                )} ${cleaned.substring(8, 12)}`;
            } else if (cleaned.length >= 10) {
                return `+62 ${cleaned.substring(2, 4)} ${cleaned.substring(
                    4,
                    8
                )} ${cleaned.substring(8)}`;
            }
        }

        // If it doesn't match the expected format, return as is with basic formatting
        return phone;
    };
    return (
        <footer className="bg-white dark:bg-gray-900 border border-t">
            <div className="mx-auto w-full max-w-5xl ">
                <div className="grid grid-cols-2 gap-8 px-4 py-6 lg:py-8 md:grid-cols-4">
                    <div>
                        <h2 className="mb-6 text-sm font-semibold text-gray-900 uppercase dark:text-white">
                            Event Nusa
                        </h2>
                        <ul className="text-gray-500 dark:text-gray-400 font-medium">
                            <li className="mb-4">
                                <a
                                    href={`https://wa.me/${(
                                        adminSettings?.contact_phone ||
                                        "+6289512220026"
                                    ).replace(/\D/g, "")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline flex items-center gap-2"
                                >
                                    <FaWhatsapp /> Whatsapp
                                </a>
                            </li>
                            <li className="mb-4">
                                <a
                                    href={`mailto:${
                                        adminSettings?.contact_email ||
                                        "eventnusaindonesia@gmail.com"
                                    }`}
                                    className="hover:underline flex items-center gap-2"
                                >
                                    <MdOutlineEmail />
                                    Email
                                </a>
                            </li>
                            <li className="mb-4">
                                <div className="hover:underline">
                                    <div className="flex items-center gap-2">
                                        <FaPhone className="text-sm shrink-0" />
                                        Pusat Panggilan
                                    </div>
                                    <span className="ms-5">
                                        {formatPhoneNumber(
                                            adminSettings?.contact_phone ||
                                                "+6289512220026"
                                        )}
                                    </span>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h2 className="mb-6 text-sm font-semibold text-gray-900 uppercase dark:text-white">
                            Perusahaan
                        </h2>
                        <ul className="text-gray-500 dark:text-gray-400 font-medium">
                            <li className="mb-4">
                                <Link href="/terms" className="hover:underline">
                                    Perlindungan
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h2 className="mb-6 text-sm font-semibold text-gray-900 uppercase dark:text-white">
                            Produk
                        </h2>
                        <ul className="text-gray-500 dark:text-gray-400 font-medium">
                            <li className="mb-4">
                                <Link
                                    href="/events"
                                    className="hover:underline"
                                >
                                    Event
                                </Link>
                            </li>
                            <li className="mb-4">
                                <Link
                                    href="/services"
                                    className="hover:underline"
                                >
                                    Jasa
                                </Link>
                            </li>
                            <li className="mb-4">
                                <Link
                                    href="/buildings"
                                    className="hover:underline"
                                >
                                    Gedung
                                </Link>
                            </li>
                            <li className="mb-4">
                                <Link
                                    href="/propertys"
                                    className="hover:underline"
                                >
                                    Properti
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h2 className="mb-6 text-sm font-semibold text-gray-900 uppercase dark:text-white">
                            Dukungan
                        </h2>
                        <ul className="text-gray-500 dark:text-gray-400 font-medium">
                            <li className="mb-4">
                                <Link href="/terms" className="hover:underline">
                                    Syarat Dan Dukungan
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="px-4 py-6 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-sm text-gray-500 dark:text-gray-300 sm:text-center">
                    @2025 Eventnusa. All Rights Reserved.
                </span>
            </div>
        </footer>
    );
}
