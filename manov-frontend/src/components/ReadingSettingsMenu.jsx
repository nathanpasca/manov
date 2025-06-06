import React from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Minus, Plus, Settings2 } from "lucide-react"

export function ReadingSettingsMenu({ settings, setSettings }) {
  const FONT_STEP = 1
  const LINE_HEIGHT_STEP = 0.1

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='icon'>
          <Settings2 className='h-5 w-5' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-64'>
        <div className='grid gap-4'>
          <div className='space-y-2'>
            <h4 className='font-medium leading-none'>Reading Settings</h4>
            <p className='text-sm text-muted-foreground'>Adjust your reading experience.</p>
          </div>
          <div className='grid gap-2'>
            <div className='grid grid-cols-3 items-center gap-4'>
              <Label htmlFor='font-size'>Font Size</Label>
              <div className='col-span-2 flex items-center justify-end gap-2'>
                <Button
                  variant='outline'
                  size='icon'
                  className='h-7 w-7'
                  onClick={() => handleSettingChange("fontSize", Math.max(12, settings.fontSize - FONT_STEP))}>
                  {" "}
                  <Minus className='h-4 w-4' />{" "}
                </Button>
                <span className='w-8 text-center text-sm'>{settings.fontSize}px</span>
                <Button
                  variant='outline'
                  size='icon'
                  className='h-7 w-7'
                  onClick={() => handleSettingChange("fontSize", Math.min(24, settings.fontSize + FONT_STEP))}>
                  {" "}
                  <Plus className='h-4 w-4' />{" "}
                </Button>
              </div>
            </div>
            <div className='grid grid-cols-3 items-center gap-4'>
              <Label htmlFor='line-height'>Line Height</Label>
              <div className='col-span-2 flex items-center justify-end gap-2'>
                <Button
                  variant='outline'
                  size='icon'
                  className='h-7 w-7'
                  onClick={() =>
                    handleSettingChange("lineHeight", Math.max(1.2, parseFloat(settings.lineHeight) - LINE_HEIGHT_STEP))
                  }>
                  {" "}
                  <Minus className='h-4 w-4' />{" "}
                </Button>
                <span className='w-8 text-center text-sm'>{settings.lineHeight.toFixed(1)}</span>
                <Button
                  variant='outline'
                  size='icon'
                  className='h-7 w-7'
                  onClick={() =>
                    handleSettingChange("lineHeight", Math.min(2.5, parseFloat(settings.lineHeight) + LINE_HEIGHT_STEP))
                  }>
                  {" "}
                  <Plus className='h-4 w-4' />{" "}
                </Button>
              </div>
            </div>
            <div className='grid grid-cols-3 items-center gap-4'>
              <Label htmlFor='font-family'>Font</Label>
              <div className='col-span-2 flex items-center justify-end gap-1'>
                <Button
                  variant={settings.fontFamily === "sans" ? "secondary" : "ghost"}
                  size='sm'
                  onClick={() => handleSettingChange("fontFamily", "sans")}>
                  Sans-Serif
                </Button>
                <Button
                  variant={settings.fontFamily === "serif" ? "secondary" : "ghost"}
                  size='sm'
                  onClick={() => handleSettingChange("fontFamily", "serif")}>
                  Serif
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
