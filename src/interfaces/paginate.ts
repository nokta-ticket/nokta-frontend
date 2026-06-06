export interface Paginate {
  totalPages: number;
  currentPage: number;
  total?: number;
  perPage?: number;
  lastPage?: number;
  page?: number;
  limit?: number;
}
