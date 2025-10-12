import { HiMenu, HiClock } from "react-icons/hi";

const Header = ({ onHistoryClick }) => {
  return (
    <header className="bg-primary-500 text-white shadow-sm">
      <div className="mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button className="p-2 rounded-lg hover:bg-primary-600 transition-colors duration-200 mr-2">
              <HiMenu className="w-6 h-6" />
            </button>

            <h1 className="text-xl font-semibold">Vedda Translate</h1>
          </div>

          <button
            className="p-2 rounded-lg hover:bg-primary-600 transition-colors duration-200"
            onClick={onHistoryClick}
          >
            <HiClock className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
