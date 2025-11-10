import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const AdminWords = () => {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch words from API
    setLoading(false);
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Word Management</h1>
        <p className="text-gray-600 mt-2">Manage Vedda language dictionary words</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Dictionary Words</h2>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Add New Word
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading words...</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Word management functionality coming soon</p>
            <p className="text-gray-400 mt-2">This section will allow you to add, edit, and manage Vedda dictionary words</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWords;
