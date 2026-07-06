import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { IconMoodPuzzled } from "@tabler/icons-react"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"

export function NotFound() {
  const { t } = useTranslation()
  return (
    <div className="flex h-full min-h-svh w-full flex-col items-center justify-center">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconMoodPuzzled />
          </EmptyMedia>
          <EmptyTitle>Not Found - 404</EmptyTitle>
          <EmptyDescription>
            The page you are looking for does not exist. It might have been
            moved or deleted.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex-row justify-center gap-2">
          <Link to="/">{t("Go Back")}</Link>
        </EmptyContent>
      </Empty>
    </div>
  )
}
