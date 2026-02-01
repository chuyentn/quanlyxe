import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { addDays, startOfMonth, startOfWeek, subDays, startOfYear, startOfQuarter } from "date-fns";

export interface FilterState {
  searchPromise: string;
  dateRange: DateRange | undefined;
  status: string[];
  vehicleIds: string[];
  driverIds: string[];
}

interface ExcelFilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onRefresh?: () => void;
}

export function ExcelFilterBar({ filters, onFilterChange, onRefresh }: ExcelFilterBarProps) {
  const [searchValue, setSearchValue] = useState(filters.searchPromise || "");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    // Debounce could be added here
    onFilterChange({ ...filters, searchPromise: e.target.value });
  };

  const setDateRangePreset = (preset: 'today' | 'week' | 'month' | 'quarter') => {
    const today = new Date();
    let range: DateRange | undefined;

    switch (preset) {
      case 'today':
        range = { from: today, to: today };
        break;
      case 'week':
        range = { from: startOfWeek(today, { weekStartsOn: 1 }), to: today };
        break;
      case 'month':
        range = { from: startOfMonth(today), to: today };
        break;
      case 'quarter':
        range = { from: startOfQuarter(today), to: today };
        break;
    }
    onFilterChange({ ...filters, dateRange: range });
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-card shadow-sm">
      <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between">
        {/* Date Range & Quick Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker
            date={filters.dateRange}
            onSelect={(range) => onFilterChange({ ...filters, dateRange: range })}
            className="w-[260px]"
          />
          <div className="flex bg-muted/50 p-1 rounded-md gap-1">
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => setDateRangePreset('today')}>Hôm nay</Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => setDateRangePreset('week')}>Tuần này</Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => setDateRangePreset('month')}>Tháng này</Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => setDateRangePreset('quarter')}>Quý này</Button>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-[250px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm..."
              value={searchValue}
              onChange={handleSearchChange}
              className="pl-9 h-9"
            />
            {searchValue && (
              <X
                className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => {
                  setSearchValue("");
                  onFilterChange({ ...filters, searchPromise: "" });
                }}
              />
            )}
          </div>
          {/* Add more filter dropdowns here later (Vehicle, Driver, etc.) */}
          {/* Placeholder for "Saved Filters" */}
        </div>
      </div>
    </div>
  );
}
