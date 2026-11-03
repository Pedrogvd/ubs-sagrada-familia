import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss',
})
export class Pagination {
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Output() pageChange = new EventEmitter<number>();

  previousPage(): void {
    this.emitPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.emitPage(this.currentPage + 1);
  }

  goToFirst(): void {
    this.emitPage(1);
  }

  goToLast(): void {
    this.emitPage(this.totalPages);
  }

  onPageInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const clamped = this.clamp(input.valueAsNumber);
    input.value = String(clamped);
    this.emitPage(clamped);
  }

  private clamp(page: number): number {
    return Math.min(Math.max(1, Math.floor(page) || 1), this.totalPages);
  }

  private emitPage(page: number): void {
    const clamped = this.clamp(page);
    if (clamped !== this.currentPage) {
      this.pageChange.emit(clamped);
    }
  }
}