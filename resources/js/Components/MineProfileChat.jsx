import React from "react";
import ProfilePictureOnChat from "@/components/ProfilePictureOnChat.jsx";
import { Link } from "@inertiajs/react";

export default function MineProfileChat({ auth }) {
    return (
        <>
            <div className="flex flex-row items-center justify-between px-3 py-2 pt-5">
                <div className="flex items-center w-full pb-3">
                    <div className="flex flex-row min-w-0 items-center justify-between space-x-3.5">
                        <ProfilePictureOnChat user={auth.user} />
                        <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-sm font-medium text-slate-800 truncate">
                                {auth.user.name}
                            </span>
                            <span className="text-xs text-gray-400 truncate">
                                @{auth.user.username}
                            </span>
                        </div>
                    </div>
                </div>
                <div></div>
            </div>
        </>
    );
}
