"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, MapPin, Building2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COMPANY_TYPE_OPTIONS } from "@/types/leads";

const searchSchema = z.object({
  query: z.string().min(2, "Mindestens 2 Zeichen"),
  location: z.string().min(2, "Bitte einen Ort angeben"),
  company_type: z.string().optional(),
});

type SearchFormValues = z.infer<typeof searchSchema>;

interface LeadSearchFormProps {
  onSubmit: (values: SearchFormValues) => Promise<void>;
  isSearching: boolean;
}

export function LeadSearchForm({ onSubmit, isSearching }: LeadSearchFormProps) {
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { query: "", location: "", company_type: undefined },
  });

  async function handleSubmit(values: SearchFormValues) {
    await onSubmit(values);
    form.reset();
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium leading-tight">Neue Suche starten</p>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Google Places + LangSearch · inkl. Social Media
            </p>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col sm:flex-row gap-3"
          >
            <FormField
              control={form.control}
              name="query"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Branche, z.B. Steuerberater"
                        className="pl-9 h-9 text-sm"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Ort, z.B. Wien, Salzburg"
                        className="pl-9 h-9 text-sm"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="company_type"
              render={({ field }) => (
                <FormItem className="w-full sm:w-[180px]">
                  <Select
                    onValueChange={(val) => field.onChange(val === "all" ? undefined : val)}
                    value={field.value ?? "all"}
                  >
                    <FormControl>
                      <SelectTrigger className="h-9 text-sm w-full">
                        <Building2 className="h-3.5 w-3.5 mr-2 text-muted-foreground shrink-0" />
                        <SelectValue placeholder="Rechtsform" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">Alle Rechtsformen</SelectItem>
                      {COMPANY_TYPE_OPTIONS.filter((o) => o.value !== "all").map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={isSearching}
              className="h-9 px-5 shrink-0 sm:ml-2"
            >
              {isSearching ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Search className="h-3.5 w-3.5 mr-1.5" />
              )}
              {isSearching ? "Läuft..." : "Suchen"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export type { SearchFormValues };
