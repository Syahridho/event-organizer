import { Link, usePage } from "@inertiajs/react";
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { ChevronRight } from "lucide-react";
import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent,
} from "@/components/ui/collapsible";

export function NavMain({ items }) {
    const { url } = usePage();
    const currentUrl = url;

    function isMenuActive(currentUrl, menuUrl, exact = false) {
        const normalize = (url) => String(url || "").split('?')[0].replace(/\/+$/, "");

        const current = normalize(currentUrl);
        const menu = normalize(menuUrl);

        if (!menu) return false;

        if (exact) {
            return current === menu;
        }

        return current === menu || current.startsWith(menu + "/");
    }

    return (
        <SidebarGroup>
            <SidebarGroupContent className="flex flex-col gap-2">
                <SidebarMenu>
                    {items &&
                        items.map((item) => {
                            const hasSubmenu =
                                Array.isArray(item.items) &&
                                item.items.length > 0;

                            if (hasSubmenu) {
                                const isSubmenuActive = item.items.some(
                                    (subItem) =>
                                        isMenuActive(
                                            currentUrl,
                                            subItem.url,
                                            subItem.exact
                                        )
                                );

                                return (
                                    <Collapsible
                                        key={item.title}
                                        asChild
                                        defaultOpen={isSubmenuActive}
                                        className="group/collapsible"
                                    >
                                        <SidebarMenuItem>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuButton
                                                    tooltip={item.title}
                                                >
                                                    {item.icon && <item.icon />}
                                                    <span>{item.title}</span>
                                                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>

                                            <CollapsibleContent>
                                                <SidebarMenuSub>
                                                    {item.items.map(
                                                        (subItem) => (
                                                            <SidebarMenuSubItem
                                                                key={
                                                                    subItem.title
                                                                }
                                                            >
                                                                <SidebarMenuSubButton
                                                                    asChild
                                                                    tooltip={
                                                                        subItem.title
                                                                    }
                                                                    isActive={isMenuActive(
                                                                        currentUrl,
                                                                        subItem.url,
                                                                        subItem.exact
                                                                    )}
                                                                >
                                                                    <Link
                                                                        href={
                                                                            subItem.url
                                                                        }
                                                                    >
                                                                        <span>
                                                                            {
                                                                                subItem.title
                                                                            }
                                                                        </span>
                                                                    </Link>
                                                                </SidebarMenuSubButton>
                                                            </SidebarMenuSubItem>
                                                        )
                                                    )}
                                                </SidebarMenuSub>
                                            </CollapsibleContent>
                                        </SidebarMenuItem>
                                    </Collapsible>
                                );
                            } else {
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            tooltip={item.title}
                                            isActive={isMenuActive(
                                                currentUrl,
                                                item.url,
                                                item.exact
                                            )}
                                        >
                                            <Link
                                                href={item.url}
                                                prefetch="true"
                                            >
                                                {item.icon && <item.icon />}
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            }
                        })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
