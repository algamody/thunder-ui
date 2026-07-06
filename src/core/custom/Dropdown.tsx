import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslation } from "react-i18next"

export const Dropdown: typeof Select = (props) => {
  const { t } = useTranslation()
  const items =
    typeof props.items === "object" && !(props.items instanceof Array)
      ? Object.entries(props.items).map(([value, label]) => ({ label, value }))
      : props.items

  return (
    <Select {...props}>
      <SelectTrigger className="w-full max-w-48">
        <SelectValue placeholder={t("Select")} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{props.name}</SelectLabel>
          {items?.map((item) => (
            <SelectItem
              key={item.value ?? item}
              value={item.value ?? item}
              className="line-clamp-1"
            >
              {item.label ?? item.value ?? item}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
