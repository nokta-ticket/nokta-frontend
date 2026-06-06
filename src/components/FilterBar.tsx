import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { SlidersHorizontal, CalendarIcon, Check } from "lucide-react";
import { Filters } from "@/types/filters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface FilterBarProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

const categories = [
  "Show",
  "Festival",
  "Teatro",
  "Stand-up",
  "Esportes",
  "Cinema",
  "Exposição",
  "Workshop",
  "Palestra",
  "Outro",
];

const FilterBar = ({ filters, onFiltersChange }: FilterBarProps) => {
  const [cityOpen, setCityOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const handleCityChange = (value: string) => {
    onFiltersChange({ ...filters, city: value });
    setCityOpen(false);
  };

  const handleDateChange = (date: Date | undefined) => {
    onFiltersChange({ ...filters, date: date || null });
  };

  const handleCategoryChange = (value: string) => {
    onFiltersChange({ ...filters, category: value });
    setCategoryOpen(false);
  };

  const handleSortChange = (value: string) => {
    onFiltersChange({ ...filters, sortBy: value });
  };

  return (
    <div className="w-full">
      <div className="py-4">
        {/* Desktop Filters */}
        <div className="hidden items-center gap-4 md:flex">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Cidade
                  </label>
                  <Input
                    placeholder="Digite a cidade..."
                    value={filters.city === "all-cities" ? "" : filters.city}
                    onChange={(e) =>
                      handleCityChange(e.target.value || "all-cities")
                    }
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Data</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.date &&
                        filters.date instanceof Date &&
                        !isNaN(filters.date.getTime())
                          ? format(filters.date, "dd/MM/yyyy", { locale: ptBR })
                          : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.date || undefined}
                        onSelect={handleDateChange}
                        locale={ptBR}
                        className="pointer-events-auto"
                      />
                      {filters.date && (
                        <div className="border-t p-2">
                          <Button
                            variant="ghost"
                            className="w-full"
                            onClick={() => handleDateChange(undefined)}
                          >
                            Limpar data
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Categoria
                  </label>
                  <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={categoryOpen}
                        className="w-full justify-between"
                      >
                        {filters.category === "all-categories"
                          ? "Todas"
                          : filters.category}
                        <SlidersHorizontal className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[--radix-popover-trigger-width] p-0"
                      align="start"
                    >
                      <Command>
                        <CommandInput placeholder="Buscar categoria..." />
                        <CommandList>
                          <CommandEmpty>
                            Nenhuma categoria encontrada.
                          </CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="all-categories"
                              onSelect={() =>
                                handleCategoryChange("all-categories")
                              }
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  filters.category === "all-categories"
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              Todas
                            </CommandItem>
                            {categories.map((category) => (
                              <CommandItem
                                key={category}
                                value={category}
                                onSelect={() => handleCategoryChange(category)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    filters.category === category
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {category}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Ordenar por:</span>
            <Select value={filters.sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="closest">Data mais próxima</SelectItem>
                <SelectItem value="recent">Recém-anunciados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mobile Filters */}
        <div className="flex items-center justify-between md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filtrar
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Cidade
                  </label>
                  <Input
                    placeholder="Digite a cidade..."
                    value={filters.city === "all-cities" ? "" : filters.city}
                    onChange={(e) =>
                      handleCityChange(e.target.value || "all-cities")
                    }
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Data</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.date &&
                        filters.date instanceof Date &&
                        !isNaN(filters.date.getTime())
                          ? format(filters.date, "dd/MM/yyyy", { locale: ptBR })
                          : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.date || undefined}
                        onSelect={handleDateChange}
                        initialFocus
                        locale={ptBR}
                        className="pointer-events-auto"
                      />
                      {filters.date && (
                        <div className="border-t p-2">
                          <Button
                            variant="ghost"
                            className="w-full"
                            onClick={() => handleDateChange(undefined)}
                          >
                            Limpar data
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Categoria
                  </label>
                  <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={categoryOpen}
                        className="w-full justify-between"
                      >
                        {filters.category === "all-categories"
                          ? "Todas"
                          : filters.category}
                        <SlidersHorizontal className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar categoria..." />
                        <CommandList>
                          <CommandEmpty>
                            Nenhuma categoria encontrada.
                          </CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="all-categories"
                              onSelect={() =>
                                handleCategoryChange("all-categories")
                              }
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  filters.category === "all-categories"
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              Todas
                            </CommandItem>
                            {categories.map((category) => (
                              <CommandItem
                                key={category}
                                value={category}
                                onSelect={() => handleCategoryChange(category)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    filters.category === category
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {category}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Ordenar por
                  </label>
                  <Select
                    value={filters.sortBy}
                    onValueChange={handleSortChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="closest">Data mais próxima</SelectItem>
                      <SelectItem value="recent">Recém-anunciados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
