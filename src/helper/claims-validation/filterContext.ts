import { FilterContextError } from "./errors";
import { normalizeToken } from "./normalizer";
import type { FilterSelection } from "./types";

export class ClaimsFilterContext {
  private readonly selectedFilters = new Map<string, FilterSelection>();

  set(label: string, value: string): void {
    const normalizedLabel = normalizeToken(label);
    this.selectedFilters.set(normalizedLabel, { label, value });
  }

  get(label: string): string | undefined {
    const normalizedLabel = normalizeToken(label);
    return this.selectedFilters.get(normalizedLabel)?.value;
  }

  getRequired(label: string): string {
    const value = this.get(label);
    if (!value) {
      const available = this.list().map((item) => `${item.label}=${item.value}`).join(", ") || "None";
      throw new FilterContextError(
        `Missing required filter '${label}'. Available filters: ${available}`
      );
    }

    return value;
  }

  list(): FilterSelection[] {
    return [...this.selectedFilters.values()];
  }

  clear(): void {
    this.selectedFilters.clear();
  }
}
