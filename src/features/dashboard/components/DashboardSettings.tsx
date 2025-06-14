"use client"

import * as React from "react"
import { useSidebar, SidebarVariant, SidebarCollapsible } from "@/components/ui/sidebar"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"

export function DashboardSettings() {
  const {
    variant,
    setVariant,
    collapsible,
    setCollapsible,
    // Ensure a default is provided if the hook might not be ready initially,
    // though the hook throws if context is missing.
  } = useSidebar()

  // Helper to provide a default if the values are somehow undefined initially
  const currentVariant = variant || "sidebar";
  const currentCollapsible = collapsible || "offcanvas";

  return (
    <div className="space-y-6 p-4">
      <div>
        <h4 className="mb-2 font-semibold">Sidebar Settings</h4>
      </div>

      {/* Variant selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Variant</Label>
        <RadioGroup
          value={currentVariant}
          onValueChange={(value) => setVariant(value as SidebarVariant)}
          className="space-y-1"
        >
          <div>
            <RadioGroupItem value="sidebar" id="variant-sidebar" className="peer sr-only" />
            <Label
              htmlFor="variant-sidebar"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              Default
            </Label>
          </div>
          <div>
            <RadioGroupItem value="floating" id="variant-floating" className="peer sr-only" />
            <Label
              htmlFor="variant-floating"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              Floating
            </Label>
          </div>
          <div>
            <RadioGroupItem value="inset" id="variant-inset" className="peer sr-only" />
            <Label
              htmlFor="variant-inset"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              Inset
            </Label>
          </div>
        </RadioGroup>
        <p className="text-xs text-muted-foreground">
          Current variant: {currentVariant}
        </p>
      </div>

      {/* Collapsible selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Collapsible Mode</Label>
        <RadioGroup
          value={currentCollapsible}
          onValueChange={(value) => setCollapsible(value as SidebarCollapsible)}
          className="space-y-1"
        >
          <div>
            <RadioGroupItem value="offcanvas" id="collapsible-offcanvas" className="peer sr-only" />
            <Label
              htmlFor="collapsible-offcanvas"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              Off-canvas
            </Label>
          </div>
          <div>
            <RadioGroupItem value="icon" id="collapsible-icon" className="peer sr-only" />
            <Label
              htmlFor="collapsible-icon"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              Icon Only
            </Label>
          </div>
          <div>
            <RadioGroupItem value="none" id="collapsible-none" className="peer sr-only" />
            <Label
              htmlFor="collapsible-none"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              None (Always Open)
            </Label>
          </div>
        </RadioGroup>
        <p className="text-xs text-muted-foreground">
          Current collapsible mode: {currentCollapsible}
        </p>
      </div>

      {/* Example Switch (if needed for other settings, not directly for collapsible as per current design) */}
      {/* <div className="flex items-center space-x-2">
        <Switch id="some-setting-switch" />
        <Label htmlFor="some-setting-switch">Some other setting</Label>
      </div> */}
    </div>
  )
}
