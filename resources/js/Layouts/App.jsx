import React, { useEffect } from "react";
import MineProfileChat from "@/components/MineProfileChat.jsx";
import SearchChatBar from "@/components/SearchChatBar.jsx";
import ChatListUser from "@/components/ChatListUser.jsx";
import { router, usePage } from "@inertiajs/react";
import { debounce } from "lodash";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

export default function AppChat({ children }) {
    const { auth } = usePage().props;

    useEffect(() => {
        const debouncedReload = debounce(() => {
            router.reload({
                preserveScroll: true,
                only: ["messages", "users"],
            });
        }, 350);

        Echo.private("message." + auth.user.uuid)
            .listen("ReadMessageEvent", () => {
                debouncedReload();
            })
            .listen("NewMessageEvent", () => {
                debouncedReload();
            });

        return () => {
            Echo.private("message." + auth.user.uuid)
                .stopListening("ReadMessageEvent", () => {
                    debouncedReload();
                })
                .stopListening("NewMessageEvent");
        };
    }, []);

    const renderSidebarScreen = () => {
        const currentPath = route().current();
        let className =
            "px-5 py-2 pb-5 w-full lg:w-1/3 lg:border-r lg:border-gray-700 ";

        if (currentPath === "chat.index") className += "flex flex-col";
        else className += "hidden lg:flex flex-col";

        return className;
    };

    return (
        <>
            <div className="min-h-screen flex flex-col">
                <Navigation />

                <main className="">
                    <div className="relative min-h-screen bg-dots-lighter selection:bg-red-500 selection:text-white">
                        <div className="mx-auto max-w-screen-2xl">
                            <div className="h-[calc(100vh-8rem)] py-6">
                                <div className="flex h-full overflow-hidden border border-gray-700 shadow">
                                    <div className={renderSidebarScreen()}>
                                        {/* <MineProfileChat auth={auth} /> */}
                                        <SearchChatBar />
                                        <ChatListUser />
                                    </div>

                                    <div className="flex-1 lg:flex lg:w-2/3">
                                        {children}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                <Footer />
            </div>
        </>
    );
}
