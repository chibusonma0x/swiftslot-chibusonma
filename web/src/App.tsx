import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import VendorsListPage from "./pages/VendorsListPage";
import VendorDetailPage from "./pages/VendorDetailPage";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-zinc-700">SwiftSlot</h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<VendorsListPage />} />
            <Route path="/vendor/:id" element={<VendorDetailPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
