import Sidebar from './Sidebar';
import DynamicBackground from './DynamicBackground';

export default function DashboardLayout({ children }) {
  return (
    <DynamicBackground>
      <div className="min-h-screen">
        <Sidebar />
        <main className="ml-64 p-8">
          {children}
        </main>
      </div>
    </DynamicBackground>
  );
}
