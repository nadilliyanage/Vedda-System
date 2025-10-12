import { useState, useCallback } from "react";
import axios from "axios";
import { SERVICE_URLS } from "../constants/languages";

export default function useGamified() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [challenge, setChallenge] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const getNextChallenge = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${SERVICE_URLS.TRANSLATOR}/api/learn/next-challenge`);
      setChallenge(res.data);
      return res.data;
    } catch (e) {
      setError("Failed to fetch next challenge");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitChallenge = useCallback(async ({ challengeId, answer }) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${SERVICE_URLS.TRANSLATOR}/api/learn/submit`, {
        challengeId,
        answer,
      });
      setLastResult(res.data);
      return res.data;
    } catch (e) {
      setError("Failed to submit");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, challenge, lastResult, getNextChallenge, submitChallenge };
}
