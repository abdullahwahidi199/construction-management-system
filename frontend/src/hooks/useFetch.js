import { useEffect, useState } from "react";
import instance from "../api/axiosInstance";
import { getFriendlyErrorMessage } from "../utils/apiErrors";

export default function useFetch(url, options = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { skipGlobalErrorToast, ...requestConfig } = options;

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
      const res = await instance.get(
        url,
        Object.keys(config).length ? config : undefined,
      );
      setData(res.data);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Unable to load data."));
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch: fetchData };
}
