import {
  IconChevronRight as ChevronRight,
  type TablerIcon,
} from "@tabler/icons-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Link } from "react-router";

export interface INavMenuItem {
  title: string;
  path?: string;
  icon?: TablerIcon;
  isActive?: boolean;
  items?: {
    title: string;
    path?: string;
  }[];
}

export interface INavMenuProps {
  name: string;
  items?: Array<INavMenuItem>;
}

export function NavMenu({ name, items }: INavMenuProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{name}</SidebarGroupLabel>
      <SidebarMenu>
        {items?.map((item, idx) =>
          item.items?.length
            ? (
              <Collapsible
                key={item.title + idx}
                defaultOpen={item.isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger
                    render={
                      <SidebarMenuButton is="div" tooltip={item.title}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronRight className="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    }
                  />
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem, subIdx) => (
                        <SidebarMenuSubItem key={subItem.title + subIdx}>
                          <SidebarMenuSubButton
                            render={
                              <Link to={subItem.path || "#"}>
                                <span>{subItem.title}</span>
                              </Link>
                            }
                          />
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )
            : (
              <SidebarMenuItem key={item.title + idx}>
                <Link to={item.path || "#"}>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            )
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
