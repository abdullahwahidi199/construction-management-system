import { useState } from "react";
import instance from "../api/axiosInstance";
import { getFriendlyErrorMessage } from "../utils/apiErrors";

export default function useDelete() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const deleteData = async (url) => {
    try {
      setLoading(true);
      setError(null);
      const res = await instance.delete(url);
      return res.data;
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Unable to delete this item."));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { deleteData, loading, error };
}
