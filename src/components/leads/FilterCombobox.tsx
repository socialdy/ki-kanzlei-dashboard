"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface FilterComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  allLabel?: string;
  className?: string;
}

export function FilterCombobox({
  value,
  onChange,
  options,
  placeholder = "Auswählen",
  searchPlaceholder = "Suchen…",
  emptyText = "Nichts gefunden",
  allLabel = "Alle",
  className,
}: FilterComboboxProps) {
  const [open, setOpen] = useState(false);

  const allOptions = [{ value: "all", label: allLabel }, ...options];
  const currentLabel =
    value === "all"
      ? allLabel
      : options.find((opt) => opt.value === value)?.label ?? value;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("h-9 justify-between font-normal", className)}
        >
          <span className="truncate">
            {value === "all" ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              currentLabel
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-60 overflow-y-auto">
            <CommandEmpty>{emptyText}</CommandEmpty>
            {allOptions.map((opt) => (
              <CommandItem
                key={opt.value}
                value={opt.label}
                onSelect={() => {
                  onChange(opt.value === value ? "all" : opt.value);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4 shrink-0",
                    value === opt.value ? "opacity-100" : "opacity-0",
                  )}
                />
                {opt.label}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
