import { FaWhatsapp } from "react-icons/fa";
import { MdOutlineEmail } from "react-icons/md";
import { FaPhone } from "react-icons/fa6";

import { Link, router } from "@inertiajs/react";

export default function Footer() {
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
                                    href="https://wa.me/6289512220026"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline flex items-center gap-2"
                                >
                                    <FaWhatsapp /> Whatsapp
                                </a>
                            </li>
                            <li className="mb-4">
                                <a
                                    href="mailto:eventplannusantara@gmail.com"
                                    className="hover:underline flex items-center gap-2"
                                >
                                    <MdOutlineEmail />
                                    Email
                                </a>
                            </li>
                            <li className="mb-4">
                                <Link href="#" className="hover:underline">
                                    <div className="flex items-center gap-2">
                                        <FaPhone className="text-sm shrink-0" />
                                        Pusat Panggilan
                                    </div>
                                    <span className="ms-5">
                                        +628 95 1222 0026
                                    </span>
                                </Link>
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
