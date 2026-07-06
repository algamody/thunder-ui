import {
  IconChevronRight as ChevronRight,
  IconAlertCircle,
  type TablerIcon,
} from "@tabler/icons-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"

export interface INavMenuItem {
  title: string
  path?: string
  icon?: TablerIcon
  isActive?: boolean
  items?: {
    title: string
    path?: string
  }[]
}

export interface INavMenuProps {
  name?: string
  items?: Array<INavMenuItem>
  onChange?: (path: string) => void
}

export function NavMenu({ name, items, onChange }: INavMenuProps) {
  const { isMobile, setOpenMobile } = useSidebar()
  const { t } = useTranslation()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {name && <SidebarGroupLabel>{t(name)}</SidebarGroupLabel>}
        <SidebarMenu>
          {items?.map((item, idx) =>
            item.items?.length ? (
              <Collapsible
                key={item.title + idx}
                defaultOpen={item.isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger
                    render={
                      <SidebarMenuButton
                        is="div"
                        tooltip={t(item.title)}
                        size="lg"
                      >
                        {item.icon ? <item.icon /> : <IconAlertCircle />}
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
                              <Button
                                variant="ghost"
                                className="justify-start"
                                onClick={() => {
                                  if (isMobile) setOpenMobile(false)
                                  onChange?.(subItem.path || "#")
                                }}
                              >
                                <span>{t(subItem.title)}</span>
                              </Button>
                            }
                          />
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ) : (
              <SidebarMenuItem key={item.title + idx}>
                <SidebarMenuButton
                  tooltip={t(item.title)}
                  isActive={item.isActive}
                  render={
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => {
                        if (isMobile) setOpenMobile(false)
                        onChange?.(item.path || "#")
                      }}
                    >
                      {item.icon ? <item.icon /> : <IconAlertCircle />}
                      <span>{t(item.title)}</span>
                    </Button>
                  }
                ></SidebarMenuButton>
              </SidebarMenuItem>
            )
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}