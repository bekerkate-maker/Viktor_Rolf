import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

interface User {
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
}

function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const isActive = (path: string) => {
    return location.pathname.startsWith(path) ? 'active' : '';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="app-container">
      <nav className="top-nav">
        <div className="nav-brand">
          <Link to="/home" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div>
              <h1>VIKTOR & ROLF</h1>
              <div className="nav-brand-subtitle">Sample Control System</div>
            </div>
          </Link>
        </div>
        <ul className="nav-menu">
          <li>
            <Link to="/quality-control" className={isActive('/quality-control')}>
              Quality Control
            </Link>
          </li>
          <li>
            <Link to="/supplier-communications" className={isActive('/supplier-communications')}>
              Supplier Communications
            </Link>
          </li>
          {user && (
            <li className="user-menu-container">
              <button 
                className="user-menu-button"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="user-menu-content">
                  <div className="user-info">
                    <span className="user-name-display">{user.first_name} {user.last_name}</span>
                    <span className="user-job-title">{user.job_title}</span>
                  </div>
                </div>
              </button>
              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="user-dropdown-header">
                    <div className="user-dropdown-name">{user.first_name} {user.last_name}</div>
                    <div className="user-dropdown-email">{user.email}</div>
                    <div className="user-dropdown-title">{user.job_title}</div>
                  </div>
                  <button onClick={handleLogout} className="user-dropdown-logout">
                    Sign Out
                  </button>
                </div>
              )}
            </li>
          )}
        </ul>
      </nav>
      <main className="main-layout" style={{padding: 0, maxWidth: 'none'}}>
        <div className="main-content" style={{maxWidth: 'none', padding: 0}}>{children}</div>
      </main>
    </div>
  );
}

export default Layout;
