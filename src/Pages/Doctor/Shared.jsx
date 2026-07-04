import { useEffect, useState } from "react";
import API from "../../services/api";

function Shared() {
  const [data, setData] = useState(null);

  useEffect(() => {
    API.get("earnings/").then(res => setData(res.data));
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-blue-600">
        Earnings
      </h2>

      <p className="text-2xl text-green-600 mt-4">
        ${data?.total || 0}
      </p>
    </div>
  );
}

export default Shared;