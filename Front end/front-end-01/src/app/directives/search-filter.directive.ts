import { Directive, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Directive({
  selector: '[searchFilter]',
  standalone: true,
  exportAs:'searchFilter'
})
export class SearchFilterDirective {
  @Input('searchFilter') items: any[] = [];

  @Input() searchFields: string[] = [];

  @Input() minChars = 1;

  @Output() searchResults = new EventEmitter<any[]>();

  @Input() showAllWhenEmpty = true;

  constructor(private el: ElementRef<HTMLInputElement>) {}

  @HostListener('input', ['$event.target.value'])
  onInput(val: string) {
    this.filterAndEmit(val ?? '');
  }

  @HostListener('keydown.escape', ['$event'])
  onEsc(e: KeyboardEvent) {
    e.stopPropagation();
    this.el.nativeElement.value = '';
    this.filterAndEmit('');
  }

  private filterAndEmit(query: string) {
    const q = (query || '').trim().toLowerCase();
    const list = this.items || [];

    if (!q || q.length < this.minChars) {
      this.searchResults.emit(this.showAllWhenEmpty ? list : []);
      return;
    }

    const fields = this.searchFields?.length
      ? this.searchFields
      : this.inferFields(list);

    const filtered = list.filter(obj =>
      fields.some(f => {
        const v = obj?.[f];
        return v !== undefined && v !== null &&
               v.toString().toLowerCase().includes(q);
      })
    );

    this.searchResults.emit(filtered);
  }

  private inferFields(list: any[]): string[] {
    const first = (list && list[0]) || {};
    return Object.keys(first).filter(k => {
      const t = typeof first[k];
      return t === 'string' || t === 'number';
    });
  }

}
