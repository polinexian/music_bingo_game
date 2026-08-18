import { Routes, Route, Navigate } from 'react-router-dom';
import Host from './routes/Host';
import Display from './routes/Display';

export default function App() {
  return (
    <Routes>
      <Route path="/host" element={<Host />} />
      <Route path="/display" element={<Display />} />
      <Route path="*" element={<Navigate to="/host" replace />} />
    </Routes>
  );
}
