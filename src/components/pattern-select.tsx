import * as React from "react";
import { Check, ChevronsUpDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PATTERN_GROUPS, ALL_PATTERNS } from "@/lib/patterns";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface PatternSelectProps {
  value: string;
  onChange: (value: string) => void;
  selectedTopic?: string;
  error?: string;
}

export function PatternSelect({ value, onChange, selectedTopic, error }: PatternSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const matchedStandardPattern = React.useMemo(() => {
    if (!value) return null;
    return ALL_PATTERNS.find((p) => p.toLowerCase() === value.toLowerCase()) || null;
  }, [value]);

  const isCustom = React.useMemo(() => {
    if (!value) return false;
    return !matchedStandardPattern;
  }, [value, matchedStandardPattern]);

  const displayLabel = React.useMemo(() => {
    if (!value) return "Select a pattern (optional)...";
    if (matchedStandardPattern) return matchedStandardPattern;
    return `${value} (Custom)`;
  }, [value, matchedStandardPattern]);

  // Find suggested patterns for the selected topic
  const suggestedPatterns = React.useMemo(() => {
    if (!selectedTopic) return [];
    const group = PATTERN_GROUPS.find(
      (g) => g.topic.toLowerCase() === selectedTopic.trim().toLowerCase(),
    );
    return group ? group.patterns : [];
  }, [selectedTopic]);

  // Filter lists based on the search input
  const query = search.trim().toLowerCase();

  const filteredSuggested = React.useMemo(() => {
    if (!suggestedPatterns.length) return [];
    if (!query) return suggestedPatterns;
    return suggestedPatterns.filter((p) => p.toLowerCase().includes(query));
  }, [suggestedPatterns, query]);

  const filteredOthers = React.useMemo(() => {
    // If we have suggested patterns, 'others' are everything else
    const baseList = suggestedPatterns.length
      ? ALL_PATTERNS.filter((p) => !suggestedPatterns.includes(p))
      : ALL_PATTERNS;

    if (!query) return baseList;
    return baseList.filter((p) => p.toLowerCase().includes(query));
  }, [suggestedPatterns, query]);

  // Determine if the search query is a new custom option
  const showCustomOption = React.useMemo(() => {
    if (!query) return false;
    return !ALL_PATTERNS.some((p) => p.toLowerCase() === query);
  }, [query]);

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
            {isCustom && <HelpCircle className="h-4 w-4 shrink-0 text-muted-foreground" />}
            {displayLabel}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search or type pattern..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {filteredSuggested.length === 0 && filteredOthers.length === 0 && !showCustomOption && (
              <CommandEmpty>No patterns found.</CommandEmpty>
            )}

            {/* Custom Option creation item */}
            {showCustomOption && (
              <CommandGroup heading="Custom Pattern">
                <CommandItem
                  value={search}
                  onSelect={() => {
                    onChange(search.trim());
                    setOpen(false);
                    setSearch("");
                  }}
                  className="flex items-center justify-between cursor-pointer font-medium text-primary hover:bg-accent"
                >
                  <span className="truncate">Add custom: "{search.trim()}"</span>
                </CommandItem>
              </CommandGroup>
            )}

            {/* Suggested Patterns */}
            {filteredSuggested.length > 0 && (
              <CommandGroup heading="Suggested Patterns">
                {filteredSuggested.map((pattern) => {
                  const isSelected = value.toLowerCase() === pattern.toLowerCase();
                  return (
                    <CommandItem
                      key={pattern}
                      value={pattern}
                      onSelect={() => {
                        onChange(pattern);
                        setOpen(false);
                        setSearch("");
                      }}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <span>{pattern}</span>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {/* Other Patterns / All Patterns */}
            {filteredOthers.length > 0 && (
              <CommandGroup
                heading={suggestedPatterns.length > 0 ? "Other Patterns" : "All Patterns"}
              >
                {filteredOthers.map((pattern) => {
                  const isSelected = value.toLowerCase() === pattern.toLowerCase();
                  return (
                    <CommandItem
                      key={pattern}
                      value={pattern}
                      onSelect={() => {
                        onChange(pattern);
                        setOpen(false);
                        setSearch("");
                      }}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <span>{pattern}</span>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {/* If the current value is custom, show a way to re-select it */}
            {isCustom && !search.trim() && (
              <CommandGroup heading="Active Custom Pattern">
                <CommandItem
                  value={value}
                  onSelect={() => {
                    onChange(value);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="flex items-center justify-between cursor-pointer text-muted-foreground bg-accent/40"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <HelpCircle className="h-3.5 w-3.5 shrink-0" />
                    {value} (Keep Custom)
                  </span>
                  <Check className="h-4 w-4 text-primary" />
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
