import { useEffect, useState } from "react";
import instance from "../api/axiosInstance";
import { getFriendlyErrorMessage } from "../utils/apiErrors";

export default function useFetch(url, options = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const {
    skipGlobalErrorToast,
    fetchAllPages = false,
    pageSize = 100,
    ...requestConfig
  } = options;

  useEffect(() => {
    fetchData();
  }, [url]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const config = { ...requestConfig };
      if (skipGlobalErrorToast !== undefined) {
        config.skipGlobalErrorToast = skipGlobalErrorToast;
      }
      const initialUrl = fetchAllPages
        ? `${url}${url.includes("?") ? "&" : "?"}page_size=${pageSize}`
        : url;
      const res = await instance.get(
        initialUrl,
        Object.keys(config).length ? config : undefined,
      );

      if (!fetchAllPages || Array.isArray(res.data)) {
        setData(res.data);
        return;
      }

      const results = [...(res.data?.results || [])];
      let nextUrl = res.data?.next;

      while (nextUrl) {
        const nextResponse = await instance.get(
          nextUrl,
          Object.keys(config).length ? config : undefined,
        );
        results.push(...(nextResponse.data?.results || []));
        nextUrl = nextResponse.data?.next;
      }

      setData(results);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Unable to load data."));
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch: fetchData };
}
