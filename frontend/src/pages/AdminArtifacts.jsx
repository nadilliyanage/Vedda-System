import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const AdminArtifacts = () => {
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch artifacts from API
    setLoading(false);
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Artifact Management</h1>
        <p className="text-gray-600 mt-2">Manage cultural artifacts and historical items</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Artifacts</h2>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Add New Artifact
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading artifacts...</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Artifact management functionality coming soon</p>
            <p className="text-gray-400 mt-2">This section will allow you to add, edit, and manage cultural artifacts</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminArtifacts;
