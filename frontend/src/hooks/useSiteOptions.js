import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";

/*
  useSiteOptions(module, businessEntity)
  ───────────────────────────────────────
  Reusable hook. Any page calls this to get the list of
  Active sites saved under a specific Module + Business Entity.

  Usage example in InwardOutwardNote.jsx:
    const { sites, loading } = useSiteOptions("Inventory", "Inward/Outward Note");

    <select name="site">
      {sites.map((s) => (
        <option key={s._id} value={s.siteCode}>{s.siteCode} — {s.siteName}</option>
      ))}
    </select>
*/

const useSiteOptions = (module, businessEntity) => {
  const [sites, setSites]     = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!module || !businessEntity) {
      setSites([]);
      return;
    }

    const fetchSites = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/sites/filter`, {
          params: { module, businessEntity, status: "Active" },
        });
        setSites(res.data);
      } catch (err) {
        console.log("Error loading sites:", err);
        setSites([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSites();
  }, [module, businessEntity]);

  return { sites, loading };
};

export default useSiteOptions;