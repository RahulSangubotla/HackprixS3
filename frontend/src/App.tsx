import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Marketplace from "./pages/Marketplace";
import CartPage from "./pages/CartPage";
import Playground from "./pages/Playground";
import Profile from "./pages/Profile";
import SubjectDetail from "./pages/SubjectDetail";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import Lounge from "./pages/Lounge";
import QuizRoom from "./pages/QuizRoom";
const App = () => (
  <BrowserRouter>
    <Routes>
      {/* Routes for unauthenticated users */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Routes for authenticated users */}
      <Route element={<ProtectedRoute />}>
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/playground" element={<Playground />} />
                <Route path="/lounge" element={<Lounge />} />
                <Route path="/quiz-room/:subjectId" element={<QuizRoom />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/subject/:subjectId" element={<SubjectDetail />} />
               {/* <Route path="/3d-kahoot" element={() => {
                  window.location.href = 'https://codesandbox.io/p/github/Srijan-Alt/3D-Kahoot/main';
                  return null;
                }} />*/}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          }
        />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default App;