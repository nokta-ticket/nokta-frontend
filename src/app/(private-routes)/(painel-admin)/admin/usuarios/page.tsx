"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { UserTable } from "../_components/user-table";

const filters: { label: string; value: 0 | 2 | 3 }[] = [
  { label: "TODOS", value: 0 },
  { label: "COMUM", value: 2 },
  { label: "PRODUTOR", value: 3 },
];

export default function UsuariosPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<0 | 2 | 3>(0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Usuários da Plataforma</h1>

        <div className="relative w-full sm:w-80">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <Input
            placeholder="Buscar por nome ou e-mail"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((option) => (
          <Button
            key={option.label}
            onClick={() => setFilter(option.value)}
            variant={filter === option.value ? "default" : "outline"}
            className={
              filter === option.value
                ? "bg-violet-600 text-white hover:bg-violet-700"
                : "text-sm"
            }
          >
            {option.value === 0
              ? "Todos"
              : option.value === 2
              ? "Usuários Comuns"
              : "Produtores"}
          </Button>
        ))}
      </div>

      <UserTable search={search} filter={filter} />
    </div>
  );
}
