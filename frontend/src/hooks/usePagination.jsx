// src/hooks/usePagination.js
import { useState } from "react";

export default function usePagination(initialPage = 1, initialPageSize = 20) {
  const [page, setPage] = useState(initialPage);
  const [pageSize] = useState(initialPageSize);

  const nextPage = () => setPage((p) => p + 1);
  const prevPage = () => setPage((p) => Math.max(1, p - 1));
  const goToPage = (p) => setPage(p);

  return { page, pageSize, nextPage, prevPage, goToPage, setPage };
}
