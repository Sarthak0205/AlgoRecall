import * as React from "react";
import { Check, ChevronsUpDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { TOPICS } from "@/lib/topics";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface TopicSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function TopicSelect({ value, onChange, error }: TopicSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const isLegacy = React.useMemo(() => {
    if (!value) return false;
    return !TOPICS.some((t) => t.toLowerCase() === value.toLowerCase());
  }, [value]);

  const matchedStandardTopic = React.useMemo(() => {
    if (!value) return null;
    return TOPICS.find((t) => t.toLowerCase() === value.toLowerCase()) || null;
  }, [value]);

  // Normalized display label
  const displayLabel = React.useMemo(() => {
    if (!value) return "Select a topic...";
    if (matchedStandardTopic) return matchedStandardTopic;
    return `${value} (Legacy)`;
  }, [value, matchedStandardTopic]);

  const filteredTopics = React.useMemo(() => {
    if (!search.trim()) return TOPICS;
    const query = search.toLowerCase();
    return TOPICS.filter((t) => t.toLowerCase().includes(query));
  }, [search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-invalid={!!error}
          className={cn(
            "flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-ring text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus:ring-destructive",
            !value && "text-muted-foreground",
          )}
        >
          <span className="flex items-center gap-1.5 truncate">
            {isLegacy && <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />}
            {displayLabel}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search topic..." value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>No topic found.</CommandEmpty>

            {/* Standard Topics */}
            <CommandGroup heading="Standard Topics">
              {filteredTopics.map((topic) => {
                const isSelected = matchedStandardTopic === topic;
                return (
                  <CommandItem
                    key={topic}
                    value={topic}
                    onSelect={() => {
                      onChange(topic);
                      setOpen(false);
                      setSearch("");
                    }}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <span>{topic}</span>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </CommandItem>
                );
              })}
            </CommandGroup>

            {/* Legacy Topic Selection */}
            {isLegacy && !search.trim() && (
              <CommandGroup heading="Current Legacy Topic">
                <CommandItem
                  value={value}
                  onSelect={() => {
                    // Re-select standard casing if possible, else keep as is
                    onChange(value);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="flex items-center justify-between bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    {value} (Keep Legacy)
                  </span>
                  <Check className="h-4 w-4" />
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
