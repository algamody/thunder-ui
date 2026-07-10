import React from "react"
import {
  IconHighlight,
  IconLink,
  IconMarkdown,
  IconPhotoPlus,
  IconStrikethrough,
  IconSubscript,
  IconSuperscript,
} from "@tabler/icons-react"
import { useTranslation } from "react-i18next"
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  BoldItalicUnderlineToggles,
  CodeToggle,
  UndoRedo,
  imagePlugin,
  insertImage$,
  Separator,
  Button as MDXButton,
  usePublisher,
  diffSourcePlugin,
  DiffSourceToggleWrapper,
  linkPlugin,
  ListsToggle,
  ButtonWithTooltip,
  applyFormat$,
  BlockTypeSelect,
  InsertTable,
  InsertThematicBreak,
  tablePlugin,
  thematicBreakPlugin,
  useCellValue,
  activeEditor$,
} from "@mdxeditor/editor"
import {
  $getSelection,
  $isRangeSelection,
  $setSelection,
  type RangeSelection,
} from "lexical"
import { $isLinkNode, $toggleLink } from "@lexical/link"

import "@mdxeditor/editor/style.css"

import { handleUpload } from "../lib/utils"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { DialogRootActions } from "@base-ui/react/dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageUpload } from "./ImageUpload"
import { Input } from "@/components/ui/input"

function CustomImageButton({ onClick }: { onClick?: () => void }) {
  const { t } = useTranslation()
  const sheetRef = React.useRef<DialogRootActions>(null)
  const insertImageToEditor = usePublisher(insertImage$)

  const [src, setSrc] = React.useState("")
  const [alt, setAlt] = React.useState("")
  const [title, setTitle] = React.useState("")

  function submit() {
    if (!src.trim()) return

    insertImageToEditor({
      src: src.trim(),
      altText: alt.trim(),
      title: title.trim() || undefined,
    })

    setSrc("")
    setAlt("")
    setTitle("")

    sheetRef.current!.close()
  }

  return (
    <Sheet actionsRef={sheetRef}>
      <SheetTrigger
        render={
          <MDXButton
            type="button"
            title={t("Insert Image")}
            aria-label={t("Insert image")}
            onClick={() => {
              onClick?.()
            }}
          >
            <IconPhotoPlus stroke={2} />
          </MDXButton>
        }
      ></SheetTrigger>

      <SheetContent side="bottom" className="mx-auto mb-2 max-w-sm rounded-2xl">
        <SheetHeader>
          <SheetTitle className="text-xl">{t("Insert Image")}</SheetTitle>
          <SheetDescription>
            {t("Drag and drop an image or enter the image URL below.")}
          </SheetDescription>
        </SheetHeader>

        <div className="px-5">
          <Tabs defaultValue="default">
            <TabsList className="mx-auto">
              <TabsTrigger value="default">{t("Image")}</TabsTrigger>
              <TabsTrigger value="manual">{t("Url")}</TabsTrigger>
            </TabsList>
            <TabsContent value="default">
              <ImageUpload
                multi={false}
                onUpload={async ({ file }, signal) => {
                  if (file instanceof File) {
                    const { url } = await handleUpload(file, {
                      path: "postMedia",
                      signal,
                    })

                    if (url) setSrc(url)
                  }
                }}
              />
            </TabsContent>
            <TabsContent value="manual">
              <FieldGroup>
                <Field>
                  <FieldLabel>{t("Image URL")}</FieldLabel>
                  <Input
                    placeholder={t("Enter image URL")}
                    value={src}
                    onChange={(e) => setSrc(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel>{t("Alt Text")}</FieldLabel>
                  <Input
                    placeholder={t("Enter alt text")}
                    value={alt}
                    onChange={(e) => setAlt(e.target.value)}
                  />
                </Field>
              </FieldGroup>
            </TabsContent>
          </Tabs>
        </div>

        <SheetFooter>
          <Button className="w-full" onClick={submit}>
            {t("Submit")}
          </Button>
          <Button variant="outline" onClick={() => sheetRef.current!.close()}>
            {t("Dismiss")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function StrikeThroughToggle() {
  const applyFormat = usePublisher(applyFormat$)

  return (
    <ButtonWithTooltip
      title="Strikethrough"
      type="button"
      onClick={() => applyFormat("strikethrough")}
    >
      <IconStrikethrough stroke={2} />
    </ButtonWithTooltip>
  )
}

function SuperscriptToggle() {
  const applyFormat = usePublisher(applyFormat$)

  return (
    <ButtonWithTooltip
      title="Superscript"
      type="button"
      onClick={() => applyFormat("superscript")}
    >
      <IconSuperscript stroke={2} />
    </ButtonWithTooltip>
  )
}

function SubscriptToggle() {
  const applyFormat = usePublisher(applyFormat$)

  return (
    <ButtonWithTooltip
      title="Subscript"
      type="button"
      onClick={() => applyFormat("subscript")}
    >
      <IconSubscript stroke={2} />
    </ButtonWithTooltip>
  )
}

function HighlightToggle() {
  const applyFormat = usePublisher(applyFormat$)

  return (
    <ButtonWithTooltip
      title="Highlight"
      type="button"
      onClick={() => applyFormat("highlight")}
    >
      <IconHighlight stroke={2} />
    </ButtonWithTooltip>
  )
}

function CustomLinkButton({ onClick }: { onClick?: () => void }) {
  const { t } = useTranslation()
  const sheetRef = React.useRef<DialogRootActions>(null)

  const editor = useCellValue(activeEditor$)

  const savedSelectionRef = React.useRef<RangeSelection | null>(null)

  const [selectedText, setSelectedText] = React.useState("")
  const [url, setUrl] = React.useState("")
  const [title, setTitle] = React.useState("")

  function saveCurrentSelection() {
    editor?.getEditorState().read(() => {
      const selection = $getSelection()

      if (!$isRangeSelection(selection) || selection.isCollapsed()) {
        savedSelectionRef.current = null
        setSelectedText("")
        setUrl("")
        setTitle("")
        return
      }

      savedSelectionRef.current = selection.clone()
      setSelectedText(selection.getTextContent())

      const node = selection.anchor.getNode()
      const parent = node.getParent()

      const linkNode = $isLinkNode(node)
        ? node
        : $isLinkNode(parent)
          ? parent
          : null

      if (linkNode) {
        setUrl(linkNode.getURL())

        const title = linkNode.getTitle?.()
        setTitle(title || "")
      } else {
        setUrl("")
        setTitle("")
      }
    })
  }

  function reset() {
    savedSelectionRef.current = null
    setSelectedText("")
    setUrl("")
    setTitle("")
  }

  function submit() {
    const cleanUrl = url.trim()
    const cleanTitle = title.trim()

    if (!cleanUrl) return
    if (!editor) return

    editor.update(() => {
      const savedSelection = savedSelectionRef.current

      if (savedSelection) {
        $setSelection(savedSelection.clone())

        $toggleLink(
          cleanUrl,
          cleanTitle
            ? {
                title: cleanTitle,
              }
            : undefined
        )
      }
    })

    reset()
    sheetRef.current?.close()
  }

  return (
    <Sheet actionsRef={sheetRef}>
      <SheetTrigger
        render={
          <MDXButton
            type="button"
            title={t("Insert Link")}
            aria-label={t("Insert link")}
            onMouseDown={(event) => {
              /**
               * Important:
               * Prevent toolbar button from stealing editor focus
               * before we save the current selection.
               */
              event.preventDefault()
              saveCurrentSelection()
            }}
            onClick={() => {
              onClick?.()
            }}
          >
            <IconLink stroke={2} />
          </MDXButton>
        }
      />

      <SheetContent side="bottom" className="mx-auto mb-2 max-w-sm rounded-2xl">
        <SheetHeader>
          <SheetTitle className="text-xl">{t("Insert Link")}</SheetTitle>
          <SheetDescription>
            {selectedText
              ? t("Add a link to the selected text.")
              : t("Select some text first, then add a link.")}
          </SheetDescription>
        </SheetHeader>

        <div className="px-5">
          <FieldGroup>
            <Field>
              <FieldLabel>{t("Selected Text")}</FieldLabel>
              <Input value={selectedText} readOnly />
            </Field>

            <Field>
              <FieldLabel>{t("URL")}</FieldLabel>
              <Input
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel>{t("Title")}</FieldLabel>
              <Input
                placeholder={t("Optional")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
          </FieldGroup>
        </div>

        <SheetFooter>
          <Button
            className="w-full"
            disabled={!selectedText || !url.trim()}
            onClick={submit}
          >
            {t("Submit")}
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              reset()
              sheetRef.current?.close()
            }}
          >
            {t("Dismiss")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export interface IMarkdownEditorProps {
  className?: string
  value: string
  onChange: (value: string) => void
}

export function MarkdownEditor({
  className,
  value,
  onChange,
}: IMarkdownEditorProps) {
  const [originalValue] = React.useState(value)

  return (
    <div className="[&_.mdxeditor a]:text-blue-600 [&_.mdxeditor a]:underline [&_.mdxeditor a]:underline-offset-2 no-scrollbar flex max-h-[85dvh] flex-col overflow-auto rounded-xl border bg-background dark:[&_.mdxeditor_a]:text-blue-500 [:fullscreen]:h-screen [:fullscreen]:w-screen [:fullscreen]:rounded-none [:fullscreen]:border-0">
      <MDXEditor
        contentEditableClassName="
          prose prose-zinc dark:prose-invert
          max-w-none
          min-h-[300px]
          px-4 py-3
          text-base
          text-foreground
          dark:text-foreground
          outline-none

          [&_p]:text-foreground
          dark:[&_p]:text-foreground
        "
        markdown={value ?? ""}
        onChange={onChange}
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          markdownShortcutPlugin(),
          diffSourcePlugin({
            diffMarkdown: originalValue,
            viewMode: "rich-text",
          }),
          tablePlugin(),
          thematicBreakPlugin(),
          linkPlugin(),
          imagePlugin({
            disableImageSettingsButton: true,
          }),
          toolbarPlugin({
            toolbarContents: () => (
              <DiffSourceToggleWrapper>
                <div className="flex w-full min-w-0 flex-1 items-center gap-2">
                  <div className="flex shrink-0 items-center gap-1">
                    <UndoRedo />
                    <Separator />
                  </div>
                  <div className="no-scrollbar flex min-w-0 items-center gap-1 overflow-x-auto">
                    <BoldItalicUnderlineToggles />
                    <HighlightToggle />
                    <Separator />
                    <StrikeThroughToggle />
                    <SuperscriptToggle />
                    <SubscriptToggle />
                    <Separator />
                    <ListsToggle />
                    <Separator />
                    <BlockTypeSelect />
                    <Separator />
                    <InsertTable />
                    <InsertThematicBreak />
                    <Separator />
                    <CustomImageButton />
                    <CustomLinkButton />
                    <CodeToggle />
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Separator />
                  </div>
                </div>
              </DiffSourceToggleWrapper>
            ),
          }),
        ]}
        className={className}
      />
    </div>
  )
}

export function MarkdownEditorField(props: IMarkdownEditorProps) {
  const { t } = useTranslation()
  const sheetRef = React.useRef<DialogRootActions>(null)

  return (
    <Sheet actionsRef={sheetRef}>
      <SheetTrigger
        render={
          <Button
            type="button"
            title={t("Edit Markdown")}
            aria-label={t("Edit Markdown")}
          >
            <IconMarkdown stroke={2} /> {t("Edit Markdown")}
          </Button>
        }
      ></SheetTrigger>

      <SheetContent side="bottom" className="min-h-svh">
        <SheetHeader>
          <SheetTitle className="text-xl">{t("Edit Markdown")}</SheetTitle>
          <SheetDescription>
            {t("Edit your markdown content below.")}
          </SheetDescription>
        </SheetHeader>

        <div className="px-5">
          <MarkdownEditor {...props} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
