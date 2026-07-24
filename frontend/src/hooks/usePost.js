import { useState } from "react";
import instance from "../api/axiosInstance";
import { getFriendlyErrorMessage } from "../utils/apiErrors";

export default function usePost() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const postData = async (url, payload) => {
    try {
      setLoading(true);
      setError(null); // ✅ important fix

      const res = await instance.post(url, payload);
      return res.data;
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Unable to save changes."));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { postData, loading, error };
}
