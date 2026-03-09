"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, MapPin, Building2, Sparkles, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
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

export type SearchSource = "native" | "n8n";

interface LeadSearchFormProps {
  onSubmit: (values: SearchFormValues, source: SearchSource) => Promise<void>;
  isSearching: boolean;
  searchSource?: SearchSource | null;
}

export function LeadSearchForm({ onSubmit, isSearching, searchSource }: LeadSearchFormProps) {
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { query: "", location: "", company_type: undefined },
  });

  async function handleSubmit(source: SearchSource) {
    const valid = await form.trigger();
    if (!valid) return;
    const values = form.getValues();
    await onSubmit(values, source);
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
              Unternehmen finden · inkl. Kontaktdaten & Social Media
            </p>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="space-y-3"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <InputGroup className="h-9">
                        <InputGroupAddon>
                          <Search className="h-3.5 w-3.5" />
                        </InputGroupAddon>
                        <InputGroupInput
                          placeholder="Branche, z.B. Steuerberater"
                          className="text-sm"
                          {...field}
                        />
                      </InputGroup>
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
                      <InputGroup className="h-9">
                        <InputGroupAddon>
                          <MapPin className="h-3.5 w-3.5" />
                        </InputGroupAddon>
                        <InputGroupInput
                          placeholder="Ort, z.B. Wien, Salzburg"
                          className="text-sm"
                          {...field}
                        />
                      </InputGroup>
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
            </div>

            {/* Two search buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Button
                type="button"
                disabled={isSearching}
                className="h-9 px-5"
                onClick={() => handleSubmit("native")}
              >
                {isSearching && searchSource === "native" ? (
                  <Spinner className="h-3.5 w-3.5 mr-1.5" />
                ) : (
                  <Search className="h-3.5 w-3.5 mr-1.5" />
                )}
                {isSearching && searchSource === "native" ? "Läuft..." : "Native Suche"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isSearching}
                className="h-9 px-5"
                onClick={() => handleSubmit("n8n")}
              >
                {isSearching && searchSource === "n8n" ? (
                  <Spinner className="h-3.5 w-3.5 mr-1.5" />
                ) : (
                  <Workflow className="h-3.5 w-3.5 mr-1.5" />
                )}
                {isSearching && searchSource === "n8n" ? "Läuft..." : "n8n Suche"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export type { SearchFormValues };
